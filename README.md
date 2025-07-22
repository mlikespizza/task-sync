Here’s your updated README file for **TaskSync**, customized with your information and repository details. You can copy and paste this directly into your `README.md`:

---

````markdown
# 🚀 TaskSync - Real-Time Collaborative Task Management

A beautiful, modern task management application with real-time collaboration features, built with Next.js, Express.js, and Socket.IO.

![TaskSync Preview](https://via.placeholder.com/800x400/667eea/ffffff?text=TaskSync+Preview)

## ✨ Features

- **🔄 Real-Time Collaboration** – Multiple users can work simultaneously with instant updates
- **🎯 Drag & Drop Interface** – Intuitive Kanban board with smooth drag-and-drop functionality
- **🎨 Modern UI Design** – Beautiful gradient backgrounds with glass-morphism effects
- **📱 Responsive Design** – Works perfectly on desktop, tablet, and mobile devices
- **⚡ Fast Performance** – Built with Next.js 15 and React 19 for optimal speed
- **🔗 WebSocket Integration** – Real-time updates using Socket.IO
- **💾 Persistent Storage** – Data persistence with Prisma ORM and PostgreSQL
- **🎭 Status Progression** – Click tasks to advance through: To Do → In Progress → Done

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** – React framework with App Router
- **React 19** – Latest React with concurrent features
- **TypeScript** – Type-safe development
- **@dnd-kit** – Modern drag-and-drop library
- **Zustand** – Lightweight state management
- **Socket.IO Client** – Real-time communication

### Backend
- **Express.js** – Fast, minimalist web framework
- **Socket.IO** – Real-time bidirectional communication
- **Prisma ORM** – Type-safe database toolkit
- **PostgreSQL** – Robust relational database
- **TypeScript** – Full-stack type safety

### Design & Styling
- **Tailwind CSS** – Utility-first styling
- **Glass-morphism UI** – Modern card design
- **Gradient Backgrounds** – Beautiful visual effects
- **Responsive Grid** – Adaptive layout system
- **Smooth Animations** – Enhanced user experience

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mlikespizza/task-sync.git
   cd task-sync
````

2. **Set up the backend**

   ```bash
   cd backend
   npm install

   # Create .env file
   echo "DATABASE_URL=postgresql://username:password@localhost:5432/tasksync" > .env
   echo "PORT=3001" >> .env

   # Generate Prisma client and setup database
   npx prisma generate
   npx prisma db push
   ```

3. **Set up the frontend**

   ```bash
   cd ../frontend
   npm install
   ```

4. **Start the applications**

   **Terminal 1 – Backend:**

   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 – Frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

5. **Open your browser**

   * Frontend: [http://localhost:3000](http://localhost:3000)
   * Backend API: [http://localhost:3001](http://localhost:3001)

## 📖 Usage

1. **Create Tasks** – Use the input field to add new tasks
2. **Drag & Drop** – Move tasks between columns (To Do, In Progress, Done)
3. **Click to Progress** – Click any task to move it to the next status
4. **Real-Time Sync** – Open multiple tabs to see live collaboration
5. **Delete Tasks** – Click the × to remove a task

## 🏗️ Project Structure

```
task-sync/
├── frontend/                # Next.js React application
│   ├── src/
│   │   ├── app/             # App Router structure
│   │   ├── components/      # UI components
│   │   ├── lib/             # Utility functions & socket client
│   │   ├── store/           # Zustand store for state
│   │   └── types/           # Shared TypeScript types
│   └── package.json
├── backend/                 # Express.js backend
│   ├── src/
│   │   └── index.ts         # Main server file
│   ├── prisma/
│   │   └── schema.prisma    # Prisma DB schema
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

* `GET /tasks` – Fetch all tasks
* `POST /tasks` – Create a new task
* `PUT /tasks/:id` – Update a specific task
* `DELETE /tasks/:id` – Delete a task
* `PUT /tasks/reorder` – Bulk reorder tasks

## 🌐 Socket.IO Events

* `new-task` – Broadcast task creation
* `update-task` – Broadcast task updates
* `delete-task` – Broadcast task deletion
* `bulk-reorder` – Broadcast task sorting

## 🎨 UI Design Features

* **Slate-Blue Gradient Background**
* **Sky Blue Accents for Interactions**
* **Sticky Header with Logo & Version Badge**
* **Three-Column Responsive Kanban Board**
* **Glassmorphism Cards & Task Input Field**
* **Task Counters & Column Labels**
* **Animated Hover Effects & Tooltips**

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

* Built with modern web technologies
* Inspired by tools like Trello and Linear
* Designed for learning, collaboration, and productivity

## 📧 Contact

Marvelous Edoho – [alexandriaed1@gmail.com](mailto:alexandriaed1@gmail.com)
Project Link: [https://github.com/mlikespizza/task-sync](https://github.com/mlikespizza/task-sync)

---

⭐ **Star this repo if you like it or found it helpful!**

```

Let me know if you’d like a version that includes badges, deployment instructions (e.g. Vercel + Railway), or contribution guidelines!
```
