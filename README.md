# 🚀 Meta-Prompt: AI Prompt Enhancement Platform

A professional-grade platform for improving AI prompts using both single-agent and multi-agent architectures. Features modern glass-morphism UI, async processing, and support for multiple AI providers.

![Meta-Prompt Interface](https://img.shields.io/badge/Status-Production_Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Python](https://img.shields.io/badge/Python-3.9+-blue)
![React](https://img.shields.io/badge/React-18+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green)

## ✨ Features

### 🎯 **Dual Processing Modes**
- **Single Agent (Fast)** - Quick prompt improvements with advanced techniques
- **Multi-Agent Elite** - Collaborative improvement with Prompt Engineer, Reviewer, and Lead Agent

### 🤖 **AI Provider Support**
- **Google Gemini** (gemini-1.5-pro, gemini-1.5-flash)
- **OpenAI GPT** (gpt-4, gpt-3.5-turbo, gpt-4-turbo)
- **Anthropic Claude** (claude-3-sonnet, claude-3-haiku)

### 🎨 **Modern UI/UX**
- Glass-morphism design with backdrop blur effects
- Gradient backgrounds and smooth animations
- Responsive design for all screen sizes
- Real-time progress tracking
- Quality score visualization with emoji indicators (🏆 ⭐ 📊)

### ⚡ **Advanced Capabilities**
- **Async Processing** - No browser timeouts, full progress tracking
- **Architecture Selection** - Chain-of-Thought, Meta-Cognitive, 5-Tier Framework
- **Quality Scoring** - Automatic assessment of improvement quality
- **Session History** - Complete task history with results
- **Multi-Round Processing** - Configurable improvement iterations

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  FastAPI Backend │    │  AI Providers   │
│                 │    │                 │    │                 │
│ • Modern UI     │◄──►│ • Async Tasks   │◄──►│ • Google Gemini │
│ • Real-time     │    │ • Multi-Agent   │    │ • OpenAI GPT    │
│ • Glass Design  │    │ • SQLite DB     │    │ • Anthropic     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🤖 Multi-Agent Workflow
```
Prompt Engineer → Creates improved version
       ↓
   Reviewer → Analyzes and provides feedback  
       ↓
  Lead Agent → Makes strategic decisions (APPROVE/REJECT/CONTINUE)
       ↓
Loop until approval or max rounds reached
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.9+**
- **Node.js 18+**
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/your-username/meta-prompt.git
cd meta-prompt
```

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python main.py
```

The backend will start at `http://localhost:8000`

### 3. Frontend Setup
```bash
# Navigate to frontend (new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start at `http://localhost:3000`

### 4. Configure AI Provider
1. Open `http://localhost:3000`
2. Enter your API key for chosen provider:
   - **Google Gemini**: Get key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **OpenAI**: Get key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - **Anthropic**: Get key from [Anthropic Console](https://console.anthropic.com/)

## 💡 Usage

### Single Agent Mode
1. Select **Single Agent (Fast)** improvement type
2. Choose architecture (Auto recommended)
3. Enter your prompt text
4. Add optional context and target audience
5. Click **🚀 Create Fast Improvement Task**

### Multi-Agent Elite Mode
1. Select **Multi-Agent Team (Elite Quality)** 
2. Set max rounds (3-5 recommended)
3. Enter your prompt text
4. Add optional context and target audience  
5. Click **🚀 Create Elite Improvement Task**

### Viewing Results
- Tasks process asynchronously with real-time progress
- View quality scores, processing time, and metrics
- Access complete session history
- Copy improved prompts directly

## 🔧 Configuration

### Environment Variables
Create `.env` files in both backend and frontend directories:

**Backend (.env)**
```env
DATABASE_URL=sqlite:///./prompt_improvements.db
CORS_ORIGINS=http://localhost:3000
DEBUG=true
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:8000
```

### Model Configuration
Modify `backend/config.py` for custom model settings:
```python
DEFAULT_MODELS = {
    "google": "gemini-1.5-pro",
    "openai": "gpt-4",
    "anthropic": "claude-3-sonnet-20240229"
}
```

## 🛠️ Development

### Project Structure
```
meta-prompt/
├── backend/              # FastAPI backend
│   ├── ai_providers.py   # AI provider implementations
│   ├── ai_service.py     # Single agent service
│   ├── multi_agent_service.py  # Multi-agent LangGraph workflow
│   ├── task_service.py   # Async task management
│   ├── database.py       # SQLAlchemy setup
│   ├── db_models.py      # Database models
│   └── main.py           # FastAPI app
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── types/        # TypeScript types
│   │   └── App.tsx       # Main app component
│   └── index.html
└── docs/                 # Documentation
```

### Adding New AI Providers
1. Implement provider in `backend/ai_providers.py`
2. Add provider to factory in `AIProviderFactory`
3. Update frontend provider options
4. Test with `backend/test_providers.py`

### Database Schema
- **PromptTask** - Task information and status
- **PromptImprovement** - Improvement results and metrics
- **MultiAgentSession** - Multi-agent session details

## 📊 API Endpoints

### Core Endpoints
- `POST /api/tasks` - Create improvement task
- `GET /api/tasks/{task_id}/status` - Get task status
- `GET /api/tasks/recent` - Get recent tasks
- `POST /api/test-connection` - Test AI provider connection

### WebSocket (Future)
- Real-time progress updates
- Live multi-agent session monitoring

## 🧪 Testing

### Backend Tests
```bash
cd backend
python test_multi_agent.py  # Test multi-agent workflow
python -m pytest tests/     # Run all tests
```

### Frontend Tests
```bash
cd frontend
npm test                    # Run component tests
npm run test:e2e           # Run E2E tests
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- **Backend**: Black formatter, isort, flake8
- **Frontend**: Prettier, ESLint
- **Commits**: Conventional commits with emojis

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **LangGraph** for multi-agent workflow capabilities
- **FastAPI** for excellent async API framework
- **React** and **Framer Motion** for smooth UI
- **Tailwind CSS** for modern styling
- **SQLAlchemy** for robust database ORM

## 🚨 Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check Python version
python --version  # Should be 3.9+

# Install dependencies
pip install -r requirements.txt
```

**Frontend build errors**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**API connection errors**
- Verify API keys are correctly entered
- Check network connectivity
- Ensure provider endpoints are accessible

### Getting Help
- 📧 Email: support@meta-prompt.dev
- 💬 Discord: [Join our community](https://discord.gg/meta-prompt)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/meta-prompt/issues)

---

<div align="center">

**Built with ❤️ for the AI community**

[⭐ Star us on GitHub](https://github.com/your-username/meta-prompt) • [🐦 Follow on Twitter](https://twitter.com/meta-prompt) • [🌐 Visit Website](https://meta-prompt.dev)

</div> 