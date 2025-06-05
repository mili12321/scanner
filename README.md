# 🔐 AWS Secret Scanner for GitHub Repositories

This application scans the commit history of a given GitHub repository to detect potential leaks of **AWS access secrets**. It uses the GitHub API to retrieve commit diffs, analyzes the content for secret patterns, and returns a list of findings including commit metadata and leaked values.

## 📦 Features

- Scans commits in descending order of time.
- Identifies AWS Secrets.
- Supports continuation from the last scanned commit.
- Includes two scanning modes:
  - **Main branch only**
  - **All branches**

---

## 🚀 Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/mili12321/scanner.git
   cd scanner

   ```

2. **Install dependencies:**

   ```bash
   npm install

   ```

3. **Configure your environment:**

   ```bash
   GITHUB_TOKEN=your_personal_access_token

   ```

4. **Run the server:**

   ```bash
   npm start
   ```

## 🧪 Try It Out with Postman!

1. Open **Postman**.
2. Create a new **POST** request to:  
   `http://localhost:8001/api/scanner/scan-commits`
3. In the **Body** tab, select **raw** and choose **JSON** as the format.
4. Paste the following JSON:

   ```json
   {
     "owner": "facebook",
     "repo": "react"
   }
   ```

## 📡 API Usage

_The app exposes two POST routes:_

- 🔍 Scan commits from the main branch - POST /api/scanner/scan-commits
- 🌲 Scan commits from all branches - POST /api/scanner/scan-branches
