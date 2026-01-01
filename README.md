
# 📅 Production Scheduler

A lightweight **React + Vite** web app for managing production capacity, orders, and materials.  
Inspired by **Kanban-style lean manufacturing**, this app helps track daily limits, auto-schedule orders, and monitor material usage — optimized for mobile/Android use and deployable via GitHub Pages.

---

## ✨ Features Implemented

- ✅ **Daily capacity limits per product** (e.g., 2 apples, 3 oranges)  
- ✅ **Smart order scheduling** – automatically assigns orders across days based on capacity  
- ✅ **Adjustable limits** – easily modify daily capacity as needed  
- ✅ **Dashboard** – pipeline, weekly schedule, and production metrics  
- ✅ **Notifications** – visual alerts when capacity is reached  
- ✅ **Material tracking** – define raw materials per unit, auto-calculate consumption when orders complete  
- ✅ **Kanban-style workflow** – inspired by Japanese lean manufacturing principles  

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deployment (GitHub Pages)

This project uses **Vite** and **gh-pages** for deployment.

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

3. Access your app at:
   ```
   https://<your-username>.github.io/<your-repo>/
   ```

---

## 📱 Android-Friendly Design

- **Responsive UI**: Tailwind CSS ensures layouts adapt to mobile screens.  
- **Persistent storage**: Uses `localStorage` for saving capacities, orders, and materials across sessions.  
- **Touch-first workflow**: Large buttons and clear tap targets for easy use on Android devices.  

---

## 🛠️ Tech Stack

- [React](https://react.dev/) – UI framework  
- [Vite](https://vitejs.dev/) – fast bundler & dev server  
- [Tailwind CSS v4](https://tailwindcss.com/) – utility-first styling  
- [Lucide React](https://lucide.dev/) – lightweight icons  
- [gh-pages](https://www.npmjs.com/package/gh-pages) – GitHub Pages deployment  

---

## 📖 Usage Notes

- **Data persistence**: Orders, capacities, and materials are stored in browser `localStorage`.  
- **Scheduling logic**: Orders are automatically distributed across days based on product capacity.  
- **Material consumption**: Completing an order deducts raw materials from inventory.  
- **Alerts**: Dashboard highlights when daily capacity is reached.  

---

## 🤝 Contributing

Pull requests are welcome!  
If you’d like to extend functionality (e.g., add authentication, export schedules, or integrate with APIs), fork the repo and submit a PR.

---

## 📜 License

This project is open-source under the [MIT License](LICENSE).
```

---

Would you like me to also add a **demo screenshot section** in the README (with placeholders for images you can upload later)? That makes GitHub Pages repos look more professional.
