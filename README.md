<h1 align="center">PINTBLOG
</h1>

<div align="center">

[![PintBlog](https://img.shields.io/badge/Status-Live-brightgreen)](https://mehedi.fun/) [![Version](https://img.shields.io/badge/Version-1.0.1-blue)](https://mehedi.fun/) [![License](https://img.shields.io/badge/License-MIT-yellow)](https://mehedi.fun/) [![Live Demo](https://img.shields.io/badge/Live%20Demo-https://pintblog.vercel.app/-blue)](https://pintblog.vercel.app/) 

*PintBlog is an automated cross-posting tool for Pinterest & Blogger. Publish your content to both platforms at once. One click, two platforms! Simplify and automate your content sharing.*

</div>

***

## 🌐 Live Demo

**🚀 Web Version**: [https://pintblog.vercel.app/](https://pintblog.vercel.app/)

**⚠️ Important Notice**: The live demo is currently in development mode and restricted to test users only. To use PintBlog, you'll need to deploy it yourself with your own credentials (see Quick Start below).

***

## ✨ Features
- **Dual Platform Publishing**
- **Single Interface**
- **OAuth Authentication**
- **MongoDB Integration**

## 📝 Post Options
- **Title**
- **Description**
- **Multiple Images**
- **Pinterest Pins Link**
- **Board Selection**
- **Labels/Category**
- **Keywords**

## 🔐 Authorization
- **Google OAuth**
- **Pinterest OAuth**
- **Environment Variables**

***

## 🚀 Quick Start

### Prerequisites

Before you begin, make sure you have:
- Node.js installed (v14 or higher)
- A MongoDB database
- Pinterest Developer Account
- Google Cloud Console Account

***

### ⭐ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/BotolMehedi/pintblog-cross-poster.git
   cd pintblog-cross-poster
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```env
   MONGO_URI=your_info
   PINTEREST_CLIENT_ID=your_info
   PINTEREST_CLIENT_SECRET=your_info
   PINTEREST_REDIRECT_URI=your_info
   BLOGGER_CLIENT_ID=your_info
   BLOGGER_CLIENT_SECRET=your_info
   BLOGGER_REDIRECT_URI=your_info
   ```

4. **Run the application**

   ```bash
   npm start
   ```

5. **Open in browser**

   ```
   http://localhost:3000
   ```

***

## 🔑 Getting Your Credentials

### 📌 Pinterest API Credentials

1. **Go to Pinterest Developers**
   - Visit [developers.pinterest.com](https://developers.pinterest.com/)
   - Sign in with your Pinterest account

2. **Create a new app**
   - Click "Create app" or "My apps"
   - Fill in your app details (name, description, website)
   - Accept the Terms of Service

3. **Get your credentials**
   - Navigate to your app dashboard
   - Copy your `App ID` (Client ID)
   - Copy your `App Secret` (Client Secret)

4. **Set up redirect URI**
   - In app settings, add your redirect URI
   - For local development: `http://localhost:3000/callback/pinterest`
   - For production: `https://yourdomain.com/callback/pinterest`


***

### 📰 Blogger API Credentials

1. **Go to Google Cloud Console**
   - Visit [console.cloud.google.com](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create a new project**
   - Click "Select a project" → "New Project"
   - Enter project name and click "Create"

3. **Enable Blogger API**
   - Go to "APIs & Services" → "Library"
   - Search for "Blogger API v3"
   - Click on it and press "Enable"

4. **Create OAuth credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Configure consent screen if prompted
   - Select "Web application" as application type
   - Add authorized redirect :-
   - Local development: `http://localhost:3000/callback/blogger`
   - For Production: `https://yourdomain.com/callback/blogger`

5. **Get your credentials**
   - Copy your `Client ID`
   - Copy your `Client Secret`


***

### 🗄️ MongoDB Connection URI

1. **Create MongoDB Atlas account**
   - Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free

2. **Create a cluster**
   - Click "Build a Database"
   - Choose "Free" tier (M0)
   - Select your preferred region
   - Click "Create Cluster"

3. **Create database user**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Set username and password
   - Grant "Read and write to any database" privilege

4. **Whitelist your IP**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0) for development
   - Click "Confirm"

5. **Get connection string**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with your username

***

## 💡 Feature Requests

Have an idea? We'd love to hear it:

1. **Check existing requests**
2. **Create a new issue** with:
   - Detailed description
   - Use case explanation
   - Potential implementation ideas

***

## 🤝 Contributing

This is an open-source project, and contributions are welcome! Here's how to contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Feel free to modify, improve, and extend PintBlog to suit your needs!

<div align="center">

[Star](https://github.com/BotolMehedi/pintblog-cross-poster/stargazers) | [Issue](https://github.com/BotolMehedi/pintblog-cross-poster/issues) | [Discussion](https://github.com/BotolMehedi/pintblog-cross-poster/discussions)

</div>

***

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**TL;DR:** You can use this freely, modify it, sell it, whatever. Just don't blame me if something breaks!😪

***

## ⚠️ Disclaimer

This tool is created for educational and personal use purposes only.
Always comply with Pinterest and Blogger's Terms of Service and API usage policies.
The creator is not responsible for any misuse, API violations, or account suspensions.
By using this project, you agree that you are doing so at your own risk.

***

## 🙏 Special Thanks

<div align="center"><i>
A massive shoutout to <b>Claude Sonnet</b> for being the ultimate coding buddy who never complained about my debugging sessions & somehow understood my terrible broken English texts😅🙏
</i></div>

***

<div align="center">

### 🌟 Star this repo if you find it helpful!

[Portfolio](https://mehedi.fun) | [Email](mailto:hello@mehedi.fun) | [Github](https://github.com/BotolMehedi)

**Made with ❤️ and lots of 💦 by [BotolMehedi](https://github.com/BotolMehedi)**

</div>

