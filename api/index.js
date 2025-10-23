const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) return cb(null, true);
    cb(new Error('Only image files allowed!'));
  }
});


const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  pinterestAccessToken: String,
  pinterestRefreshToken: String,
  pinterestTokenExpiry: Date,
  bloggerAccessToken: String,
  bloggerRefreshToken: String,
  bloggerTokenExpiry: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Mongo
let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('Using existing MongoDB connection');
    return;
  }
  
  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Pinterest
const getPinterestAuthUrl = (userId) => {
  const scopes = 'boards:read,boards:write,pins:read,pins:write,user_accounts:read';
  return `https://www.pinterest.com/oauth/?client_id=${process.env.PINTEREST_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.PINTEREST_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${userId}`;
};

const exchangePinterestCode = async (code) => {
  const response = await axios.post('https://api.pinterest.com/v5/oauth/token', 
    new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.PINTEREST_REDIRECT_URI
    }), 
    {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  return response.data;
};

const refreshPinterestToken = async (refreshToken) => {
  const response = await axios.post('https://api.pinterest.com/v5/oauth/token',
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }),
    {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  return response.data;
};

const createPin = async (accessToken, boardId, title, description, link, imageFile) => {
  try {
    
    const formData = new FormData();
    formData.append('image', imageFile.buffer.toString('base64'));
    
    const imgurResponse = await axios.post('https://api.imgur.com/3/image', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Client-ID 546c25a59c58ad7'
      }
    });
    
    const imageUrl = imgurResponse.data.data.link;

    const pinData = {
      board_id: boardId,
      title: title,
      description: description,
      media_source: {
        source_type: 'image_url',
        url: imageUrl
      }
    };

    if (link) {
      pinData.link = link;
    }
    
    const response = await axios.post('https://api-sandbox.pinterest.com/v5/pins', pinData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return `https://www.pinterest.com/pin/${response.data.id}/`;
  } catch (error) {
    console.error('Pinterest create pin error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create Pinterest pin');
  }
};


// Blogger
const getBloggerAuthUrl = (userId) => {
  const scopes = 'https://www.googleapis.com/auth/blogger';
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.BLOGGER_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.BLOGGER_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${userId}`;
};

const exchangeBloggerCode = async (code) => {
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    code: code,
    client_id: process.env.BLOGGER_CLIENT_ID,
    client_secret: process.env.BLOGGER_CLIENT_SECRET,
    redirect_uri: process.env.BLOGGER_REDIRECT_URI,
    grant_type: 'authorization_code'
  });
  return response.data;
};

const refreshBloggerToken = async (refreshToken) => {
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    refresh_token: refreshToken,
    client_id: process.env.BLOGGER_CLIENT_ID,
    client_secret: process.env.BLOGGER_CLIENT_SECRET,
    grant_type: 'refresh_token'
  });
  return response.data;
};

const uploadImageToImgur = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile.buffer.toString('base64'));
    
    const response = await axios.post('https://api.imgur.com/3/image', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Client-ID 546c25a59c58ad7'
      }
    });
    
    return response.data.data.link;
  } catch (error) {
    return `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
  }
};

const createBlogPost = async (accessToken, blogId, title, description, images, labels, keywords) => {
  let htmlContent = `<div>${description}</div>`;
  
  if (images && images.length > 0) {
    htmlContent += '<div class="images">';
    for (const image of images) {
      const imageUrl = await uploadImageToImgur(image);
      htmlContent += `<img src="${imageUrl}" alt="${title}" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
    }
    htmlContent += '</div>';
  }
  
  if (keywords && keywords.length > 0) {
    htmlContent += `<div class="keywords"><p><strong>Keywords:</strong> ${keywords.join(', ')}</p></div>`;
  }
  
  const postData = {
    kind: 'blogger#post',
    title: title,
    content: htmlContent,
    labels: labels
  };
  
  const response = await axios.post(
    `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/`,
    postData,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data.url;
};

// ROUTES

// Home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: {
      hasMongo: !!process.env.MONGO_URI,
      hasPinterest: !!process.env.PINTEREST_CLIENT_ID,
      hasBlogger: !!process.env.BLOGGER_CLIENT_ID
    }
  });
});

// Pinterest Auth
app.get('/auth/pinterest', async (req, res) => {
  try {
    await connectDB();
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const authUrl = getPinterestAuthUrl(userId);
    res.json({ url: authUrl });
  } catch (error) {
    console.error('Pinterest auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/callback/pinterest', async (req, res) => {
  try {
    await connectDB();
    const { code, state: userId } = req.query;
    
    if (!code || !userId) {
      return res.redirect('/?error=pinterest_auth_failed');
    }
    
    const tokenData = await exchangePinterestCode(code);
    
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId });
    }
    
    user.pinterestAccessToken = tokenData.access_token;
    user.pinterestRefreshToken = tokenData.refresh_token;
    user.pinterestTokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
    
    await user.save();
    
    res.redirect('/?pinterest=success');
  } catch (error) {
    console.error('Pinterest callback error:', error);
    res.redirect('/?error=pinterest_callback_failed');
  }
});

// Blogger Auth
app.get('/auth/blogger', async (req, res) => {
  try {
    await connectDB();
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const authUrl = getBloggerAuthUrl(userId);
    res.json({ url: authUrl });
  } catch (error) {
    console.error('Blogger auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/callback/blogger', async (req, res) => {
  try {
    await connectDB();
    const { code, state: userId } = req.query;
    
    if (!code || !userId) {
      return res.redirect('/?error=blogger_auth_failed');
    }
    
    const tokenData = await exchangeBloggerCode(code);
    
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId });
    }
    
    user.bloggerAccessToken = tokenData.access_token;
    user.bloggerRefreshToken = tokenData.refresh_token;
    user.bloggerTokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
    
    await user.save();
    
    res.redirect('/?blogger=success');
  } catch (error) {
    console.error('Blogger callback error:', error);
    res.redirect('/?error=blogger_callback_failed');
  }
});

// Auth Status
app.get('/api/auth-status', async (req, res) => {
  try {
    await connectDB();
    const { userId } = req.query;
    
    if (!userId) {
      return res.json({ pinterest: false, blogger: false });
    }
    
    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.json({ pinterest: false, blogger: false });
    }
    
    res.json({
      pinterest: !!user.pinterestAccessToken,
      blogger: !!user.bloggerAccessToken
    });
  } catch (error) {
    console.error('Auth status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Pinterest Boards
app.get('/api/pinterest/boards', async (req, res) => {
  try {
    await connectDB();
    const { userId } = req.query;
    
    const user = await User.findOne({ userId });
    if (!user || !user.pinterestAccessToken) {
      return res.status(401).json({ error: 'Pinterest not authorized' });
    }
    
    if (new Date() >= user.pinterestTokenExpiry) {
      const tokenData = await refreshPinterestToken(user.pinterestRefreshToken);
      user.pinterestAccessToken = tokenData.access_token;
      user.pinterestRefreshToken = tokenData.refresh_token || user.pinterestRefreshToken;
      user.pinterestTokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
      await user.save();
    }
    
    const response = await axios.get('https://api.pinterest.com/v5/boards', {
      headers: { 'Authorization': `Bearer ${user.pinterestAccessToken}` }
    });
    
    res.json({ boards: response.data.items || [] });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Blogger Blogs
app.get('/api/blogger/blogs', async (req, res) => {
  try {
    await connectDB();
    const { userId } = req.query;
    
    const user = await User.findOne({ userId });
    if (!user || !user.bloggerAccessToken) {
      return res.status(401).json({ error: 'Blogger not authorized' });
    }
    
    if (new Date() >= user.bloggerTokenExpiry) {
      const tokenData = await refreshBloggerToken(user.bloggerRefreshToken);
      user.bloggerAccessToken = tokenData.access_token;
      user.bloggerTokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
      await user.save();
    }
    
    const response = await axios.get('https://www.googleapis.com/blogger/v3/users/self/blogs', {
      headers: { 'Authorization': `Bearer ${user.bloggerAccessToken}` }
    });
    
    res.json({ blogs: response.data.items || [] });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Post
app.post('/api/post', upload.array('images', 10), async (req, res) => {
  try {
    await connectDB();
    const { userId, title, description, category, link, keywords, blogId, boardId } = req.body;
    const images = req.files;
    
    if (!userId || !title || !description || !images || images.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const results = {
      pinterest: { success: false, urls: [], error: null },
      blogger: { success: false, url: null, error: null }
    };
    
    // Pinterest
    if (user.pinterestAccessToken && boardId) {
      try {
        if (new Date() >= user.pinterestTokenExpiry) {
          const tokenData = await refreshPinterestToken(user.pinterestRefreshToken);
          user.pinterestAccessToken = tokenData.access_token;
          user.pinterestRefreshToken = tokenData.refresh_token || user.pinterestRefreshToken;
          user.pinterestTokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
          await user.save();
        }
        
        const pinterestDescription = description.length > 500 ? description.substring(0, 497) + '...' : description;
        
        for (const image of images) {
          const pinUrl = await createPin(user.pinterestAccessToken, boardId, title.substring(0, 100), pinterestDescription, link, image);
          results.pinterest.urls.push(pinUrl);
        }
        
        results.pinterest.success = true;
      } catch (error) {
        console.error('Pinterest error:', error);
        results.pinterest.error = error.message;
      }
    }
    
    // Blogger
    if (user.bloggerAccessToken && blogId) {
      try {
        if (new Date() >= user.bloggerTokenExpiry) {
          const tokenData = await refreshBloggerToken(user.bloggerRefreshToken);
          user.bloggerAccessToken = tokenData.access_token;
          user.bloggerTokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
          await user.save();
        }
        
        const labels = category ? category.split(',').map(l => l.trim()) : [];
        const keywordList = keywords ? keywords.split(',').map(k => k.trim()) : [];
        
        const postUrl = await createBlogPost(user.bloggerAccessToken, blogId, title, description, images, labels, keywordList);
        
        results.blogger.url = postUrl;
        results.blogger.success = true;
      } catch (error) {
        console.error('Blogger error:', error);
        results.blogger.error = error.message;
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error('Post error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = app;
