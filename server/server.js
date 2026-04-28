const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });

// Models
const User = require('./models/User');
const Injury = require('./models/Injury');
const Clinic = require('./models/Clinic');
const Adoption = require('./models/Adoption');

const app = express();
app.use(cors({
    origin: ['http://localhost:5173', 'https://animalia-web-app.vercel.app']
}));
app.use(express.json({ limit: '50mb' }));

// Directories
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Animal';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const JWT_SECRET = 'supersecretkey_animalia';

// ----- AUTH ENDPOINTS -----
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({ email, password: hashedPassword, role: role || 'user' });
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
        res.status(201).json({ token, user: { id: user._id, email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
        res.json({ token, user: { id: user._id, email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token, auth denied' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----- INJURY ENDPOINTS (Roboflow Integration) -----
const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY || "ikZWrzr1w0LHe0TdhI7p";
const ROBOFLOW_URL = "https://detect.roboflow.com/injured-animal-detector-6zzbu/3";

app.post('/api/injuries/report', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image provided' });

        const { latitude, longitude } = req.body;
        const imageUrl = `/uploads/${req.file.filename}`;

        // Convert image to base64 for Roboflow API
        const imagePath = req.file.path;
        const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });

        // Call Roboflow
        let severity = 'none';
        try {
            const response = await axios({
                method: "POST",
                url: `${ROBOFLOW_URL}?api_key=${ROBOFLOW_API_KEY}&confidence=2`,
                data: imageBase64,
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });

            if (response.data && response.data.predictions) {
                const predictions = response.data.predictions;
                let maxConfidence = 0.0;
                predictions.forEach(p => {
                    if (p.class === 'injured' && p.confidence > maxConfidence) {
                        maxConfidence = p.confidence;
                    }
                });

                maxConfidence = maxConfidence * 100;
                if (maxConfidence >= 60) severity = 'high';
                else if (maxConfidence >= 35) severity = 'medium';
                else if (maxConfidence > 0) severity = 'low';
            }
        } catch (rfErr) {
            console.error("Roboflow Error:", rfErr.message);
            // Fallback securely but don't fail standard upload
        }

        const injury = new Injury({
            imageUrl,
            latitude,
            longitude,
            severity,
            reportedBy: req.user.id
        });
        await injury.save();

        res.status(201).json({ injury, message: `Injury reported! Severity: ${severity}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/injuries', authMiddleware, async (req, res) => {
    try {
        const injuries = await Injury.find().populate('reportedBy', 'email').sort({ createdAt: -1 });
        res.json(injuries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/injuries/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const injury = await Injury.findByIdAndUpdate(req.params.id, { status }, { new: true });

        if (status === 'resolved' && injury.reportedBy) {
            await User.findByIdAndUpdate(injury.reportedBy, { $inc: { rescuePoints: 10 } });
        }

        res.json(injury);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/injuries/:id', authMiddleware, async (req, res) => {
    try {
        const injury = await Injury.findById(req.params.id);
        if (!injury) return res.status(404).json({ message: 'Not found' });
        if (injury.reportedBy.toString() !== req.user.id && req.user.role !== 'org') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        await Injury.findByIdAndDelete(req.params.id);
        res.json({ message: 'Injury deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Use the GROQ API Key from env for the new analyze route
const getGroqKey = () => process.env.GROQ_API_KEY;

app.post('/api/injuries/analyze', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image provided' });

        const imagePath = req.file.path;
        const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });

        // 1. Roboflow Call
        let predictions = [];
        let imageSpecs = { width: 0, height: 0 };
        try {
            const rfResponse = await axios({
                method: "POST",
                url: `${ROBOFLOW_URL}?api_key=${ROBOFLOW_API_KEY}&confidence=2`,
                data: imageBase64,
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });

            if (rfResponse.data) {
                predictions = rfResponse.data.predictions || [];
                imageSpecs = rfResponse.data.image || { width: 0, height: 0 };
            }
        } catch (err) {
            return res.status(500).json({ error: "Roboflow analysis failed" });
        }

        // 2. Compute basic analytics
        const injuryCount = predictions.filter(p => p.class === 'injured').length;
        const highestConfidence = predictions.reduce((max, p) => (p.confidence > max ? p.confidence : max), 0) * 100;

        let severity = 'none';
        if (highestConfidence >= 50) severity = 'high';
        else if (highestConfidence >= 25) severity = 'medium';
        else if (highestConfidence > 0) severity = 'low';

        // 3. Groq Call
        let aiResponse;

        if (injuryCount > 0) {
            const prompt = `You are a professional veterinary AI. We have analyzed an image of an animal and detected ${injuryCount} injury point(s). The highest confidence score from our vision model is ${highestConfidence.toFixed(1)}%, registering as an overall severity of ${severity.toUpperCase()}. Based on this highly technical data, please provide:
1. Expected Tissue/Trauma Analysis (What does a ${severity} severity injury generally entail).
2. Immediate First Aid Steps for the user on site (Do NOT recommend performing surgery, focus on stabilization).
3. Handling Precautions to protect both the animal and the user.

Format the response strictly in JSON:
{
  "assessment": "...",
  "first_aid_steps": ["step 1", "step 2"],
  "precautions": ["...", "..."]
}
Only output the JSON text, nothing else, no markdown fences.`;

            try {
                const key = getGroqKey();
                if (!key) throw new Error("GROQ_API_KEY is not defined in environment variables");

                const groqRes = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: 'llama-3.1-8b-instant',
                        messages: [{ role: 'user', content: prompt }]
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${key}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                let rawReply = groqRes.data.choices[0].message.content;
                rawReply = rawReply.replace(/```json/g, '').replace(/```/g, '').trim();
                aiResponse = JSON.parse(rawReply);
            } catch (err) {
                console.error("Groq failed:", err.message);
                aiResponse = { error: "Failed to generate AI response. Follow general safety protocols and seek a vet immediately." };
            }
        } else {
            aiResponse = {
                assessment: "No visible injuries were localized above our confidence threshold.",
                first_aid_steps: ["Ensure the animal is comfortable and not stressed.", "Observe for behavioral anomalies.", "If you suspect internal issues, consult a vet."],
                precautions: ["Always approach cautiously as stressed animals may be defensive."]
            };
        }

        const imageUrl = `/uploads/${req.file.filename}`;

        res.json({
            imageUrl,
            predictions,
            imageSpecs,
            severity,
            analysis: aiResponse
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ----- ADOPTION ENDPOINTS -----
app.post('/api/adoptions', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image provided' });
        const { description, contactDetails } = req.body;

        const adoption = new Adoption({
            imageUrl: `/uploads/${req.file.filename}`,
            description,
            contactDetails,
            postedBy: req.user.id
        });
        await adoption.save();
        res.status(201).json(adoption);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/adoptions', async (req, res) => {
    try {
        const adoptions = await Adoption.find().populate('postedBy', 'email').sort({ createdAt: -1 });
        res.json(adoptions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/adoptions/:id', authMiddleware, async (req, res) => {
    try {
        const adoption = await Adoption.findById(req.params.id);
        if (!adoption) return res.status(404).json({ message: 'Not found' });
        if (adoption.postedBy.toString() !== req.user.id && req.user.role !== 'org') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        await Adoption.findByIdAndDelete(req.params.id);
        res.json({ message: 'Adoption deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----- CLINIC ENDPOINTS -----
app.post('/api/clinics', authMiddleware, async (req, res) => {
    try {
        const { name, phone, address, latitude, longitude } = req.body;
        const clinic = new Clinic({ name, phone, address, latitude, longitude });
        await clinic.save();
        res.status(201).json(clinic);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/clinics', async (req, res) => {
    try {
        const clinics = await Clinic.find().sort({ createdAt: -1 });
        res.json(clinics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/clinics/:id', authMiddleware, async (req, res) => {
    try {
        await Clinic.findByIdAndDelete(req.params.id);
        res.json({ message: 'Clinic removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----- GROQ CHAT ENDPOINT -----
app.post('/api/chat', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || message.trim() === "") return res.status(400).json({ error: "Message cannot be empty" });

        const key = getGroqKey();
        if (!key) throw new Error("GROQ_API_KEY is not defined");

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: message }]
            },
            {
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const reply = response.data.choices[0].message.content;
        res.json({ reply });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to get AI response" });
    }
});

// ----- ANALYTICS ENDPOINT -----
app.get('/api/analytics/impact', async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const data = await Injury.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                    reported: { $sum: 1 },
                    resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } }
                }
            }
        ]);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let analytics = [];
        let curr = new Date();
        curr.setMonth(curr.getMonth() - 5); // Start exactly 6 months ago (rolling window)

        for (let i = 0; i < 6; i++) {
            const m = curr.getMonth() + 1; // 1-12
            const y = curr.getFullYear();
            const found = data.find(d => d._id.year === y && d._id.month === m);
            analytics.push({
                month: monthNames[m - 1],
                reported: found ? found.reported : 0,
                resolved: found ? found.resolved : 0
            });
            curr.setMonth(curr.getMonth() + 1);
        }

        res.json(analytics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
