import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Create Admin User ──────────────────────────────
  const admin = await prisma.user.upsert({
    where: { clerkUserId: "user_admin_seed" },
    update: {},
    create: {
      clerkUserId: "user_admin_seed",
      email: "admin@copypastelearn.com",
      displayName: "Admin User",
      role: "ADMIN",
    },
  });
  console.log("  ✓ Admin user created");

  // ─── Create Learner User ───────────────────────────
  const learner = await prisma.user.upsert({
    where: { clerkUserId: "user_learner_seed" },
    update: {},
    create: {
      clerkUserId: "user_learner_seed",
      email: "learner@copypastelearn.com",
      displayName: "Sample Learner",
      role: "LEARNER",
    },
  });
  console.log("  ✓ Learner user created");

  // ─── Course 1: Docker Fundamentals ──────────────────
  const course1 = await prisma.course.upsert({
    where: { slug: "docker-fundamentals" },
    update: {},
    create: {
      title: "Docker Fundamentals",
      slug: "docker-fundamentals",
      description:
        "Learn Docker from scratch. Build, ship, and run containers with confidence. This hands-on course covers everything from basic container concepts to multi-stage builds.",
      thumbnailUrl: "/images/courses/docker-fundamentals.svg",
      difficulty: "BEGINNER",
      status: "PUBLISHED",
      sortOrder: 0,
      outcomes: [
        "Understand container and image concepts",
        "Build custom Docker images with Dockerfiles",
        "Manage container networking and volumes",
        "Use Docker Compose for multi-container apps",
        "Apply best practices for production containers",
      ],
      prerequisites: [
        "Basic command line familiarity",
        "Any programming language experience",
      ],
      estimatedDuration: 240,
    },
  });

  const dockerLessons = [
    {
      title: "What are Containers?",
      slug: "what-are-containers",
      description:
        "Introduction to containerization, how containers differ from VMs, and why Docker is the industry standard.",
      sortOrder: 0,
      durationSeconds: 480,
      transcript:
        "Welcome to Docker Fundamentals! In this first lesson, we'll explore what containers are and why they've revolutionized software development...",
      codeSnippets: [
        {
          label: "Run your first container",
          language: "bash",
          code: "docker run hello-world",
        },
        {
          label: "List running containers",
          language: "bash",
          code: "docker ps\ndocker ps -a  # include stopped containers",
        },
      ],
      resources: [
        { title: "Docker Documentation", url: "https://docs.docker.com/" },
      ],
    },
    {
      title: "Building Images with Dockerfiles",
      slug: "building-images",
      description:
        "Learn to write Dockerfiles and build custom images for your applications.",
      sortOrder: 1,
      durationSeconds: 720,
      transcript:
        "Now that you understand containers, let's learn how to build custom images using Dockerfiles...",
      codeSnippets: [
        {
          label: "Simple Dockerfile",
          language: "dockerfile",
          code: 'FROM node:20-slim\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --production\nCOPY . .\nEXPOSE 3000\nCMD ["node", "server.js"]',
        },
        {
          label: "Build the image",
          language: "bash",
          code: "docker build -t my-app:v1 .\ndocker images",
        },
      ],
      resources: [
        {
          title: "Dockerfile Reference",
          url: "https://docs.docker.com/engine/reference/builder/",
        },
      ],
      hasLab: true,
    },
    {
      title: "Container Networking",
      slug: "container-networking",
      description:
        "Understand Docker networking modes and connect containers together.",
      sortOrder: 2,
      durationSeconds: 600,
      transcript:
        "In this lesson, we'll dive into Docker networking...",
      codeSnippets: [
        {
          label: "Create a network",
          language: "bash",
          code: "docker network create my-network\ndocker network ls",
        },
        {
          label: "Run containers on a network",
          language: "bash",
          code: "docker run -d --name db --network my-network postgres:16\ndocker run -d --name app --network my-network -p 3000:3000 my-app:v1",
        },
      ],
      resources: [],
    },
    {
      title: "Volumes and Persistent Data",
      slug: "volumes-persistent-data",
      description:
        "Learn how to persist data with Docker volumes and bind mounts.",
      sortOrder: 3,
      durationSeconds: 540,
      transcript:
        "Container data is ephemeral by default. Let's learn how to persist it...",
      codeSnippets: [
        {
          label: "Named volumes",
          language: "bash",
          code: "docker volume create my-data\ndocker run -v my-data:/data my-app:v1",
        },
      ],
      resources: [],
    },
    {
      title: "Docker Compose",
      slug: "docker-compose",
      description:
        "Define and run multi-container applications with Docker Compose.",
      sortOrder: 4,
      durationSeconds: 900,
      transcript:
        "Docker Compose makes it easy to define multi-container applications...",
      codeSnippets: [
        {
          label: "docker-compose.yml",
          language: "yaml",
          code: 'services:\n  web:\n    build: .\n    ports:\n      - "3000:3000"\n    depends_on:\n      - db\n  db:\n    image: postgres:16\n    environment:\n      POSTGRES_PASSWORD: secret\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n\nvolumes:\n  pgdata:',
        },
        {
          label: "Run with Compose",
          language: "bash",
          code: "docker compose up -d\ndocker compose logs -f\ndocker compose down",
        },
      ],
      resources: [
        {
          title: "Compose Specification",
          url: "https://docs.docker.com/compose/compose-file/",
        },
      ],
      hasLab: true,
    },
  ];

  for (const lessonData of dockerLessons) {
    const { hasLab, ...lessonFields } = lessonData;
    const lesson = await prisma.lesson.upsert({
      where: {
        courseId_slug: { courseId: course1.id, slug: lessonData.slug },
      },
      update: { ...lessonFields },
      create: {
        ...lessonFields,
        courseId: course1.id,
        status: "PUBLISHED",
      },
    });

    if (hasLab) {
      const labPlan = {
        title: `${lesson.title} Lab`,
        description: `Hands-on practice for: ${lesson.title}`,
        dockerImage: "node:20-slim",
        memoryLimit: "256m",
        cpuLimit: "0.5",
        steps: [
          {
            title: "Setup",
            instructions: `<p>Follow the instructions from the <strong>${lesson.title}</strong> lesson.</p>`,
            checks: [
              {
                name: "Verify setup",
                command: "echo 'check passed'",
                expected: "check passed",
                hint: "Make sure you followed all the steps.",
              },
            ],
          },
          {
            title: "Complete the task",
            instructions:
              "<p>Apply what you learned and verify the result.</p>",
            checks: [
              {
                name: "Task completed",
                command: "echo 'done'",
                expected: "done",
                hint: "Review the lesson code snippets for guidance.",
              },
            ],
          },
        ],
      };

      await prisma.labDefinition.upsert({
        where: { lessonId: lesson.id },
        update: {},
        create: {
          lessonId: lesson.id,
          yamlSource: JSON.stringify(labPlan),
          compiledPlan: labPlan,
        },
      });
    }
  }
  console.log(
    `  ✓ Course "${course1.title}" with ${dockerLessons.length} lessons`
  );

  // ─── Course 2: Node.js REST APIs ────────────────────
  const course2 = await prisma.course.upsert({
    where: { slug: "nodejs-rest-apis" },
    update: {},
    create: {
      title: "Node.js REST APIs",
      slug: "nodejs-rest-apis",
      description:
        "Build production-ready REST APIs with Node.js, Express, and TypeScript. From routing to authentication, this course covers the essentials of backend development.",
      thumbnailUrl: "/images/courses/nodejs-rest-apis.svg",
      difficulty: "INTERMEDIATE",
      status: "PUBLISHED",
      sortOrder: 1,
      outcomes: [
        "Design RESTful API endpoints following best practices",
        "Implement CRUD operations with Express and TypeScript",
        "Add authentication and authorization",
        "Handle errors and validation properly",
        "Deploy your API to production",
      ],
      prerequisites: [
        "JavaScript fundamentals",
        "Basic understanding of HTTP",
        "Node.js installed locally",
      ],
      estimatedDuration: 360,
    },
  });

  const nodeLessons = [
    {
      title: "Setting Up Express with TypeScript",
      slug: "express-typescript-setup",
      description:
        "Initialize a Node.js project with Express and TypeScript for type-safe API development.",
      sortOrder: 0,
      durationSeconds: 600,
      transcript:
        "Let's start by setting up our Express project with TypeScript...",
      codeSnippets: [
        {
          label: "Initialize project",
          language: "bash",
          code: "mkdir my-api && cd my-api\nnpm init -y\nnpm install express\nnpm install -D typescript @types/express @types/node tsx",
        },
        {
          label: "Basic server",
          language: "typescript",
          code: "import express from 'express';\n\nconst app = express();\napp.use(express.json());\n\napp.get('/health', (req, res) => {\n  res.json({ status: 'ok' });\n});\n\napp.listen(3000, () => {\n  console.log('Server running on port 3000');\n});",
        },
      ],
      resources: [
        { title: "Express.js Guide", url: "https://expressjs.com/en/guide/" },
      ],
    },
    {
      title: "Routing and Controllers",
      slug: "routing-controllers",
      description:
        "Organize your API with Express Router and controller patterns.",
      sortOrder: 1,
      durationSeconds: 720,
      transcript: "Now let's organize our code with routers and controllers...",
      codeSnippets: [
        {
          label: "User router",
          language: "typescript",
          code: "import { Router } from 'express';\nimport * as userController from '../controllers/user';\n\nconst router = Router();\n\nrouter.get('/', userController.list);\nrouter.get('/:id', userController.getById);\nrouter.post('/', userController.create);\nrouter.put('/:id', userController.update);\nrouter.delete('/:id', userController.remove);\n\nexport default router;",
        },
      ],
      resources: [],
    },
    {
      title: "Database Integration with Prisma",
      slug: "database-prisma",
      description:
        "Connect your API to a database using Prisma ORM for type-safe queries.",
      sortOrder: 2,
      durationSeconds: 900,
      transcript: "Let's add a database to our API using Prisma...",
      codeSnippets: [
        {
          label: "Prisma schema",
          language: "prisma",
          code: "model User {\n  id    String @id @default(cuid())\n  email String @unique\n  name  String?\n  posts Post[]\n}\n\nmodel Post {\n  id        String   @id @default(cuid())\n  title     String\n  content   String\n  author    User     @relation(fields: [authorId], references: [id])\n  authorId  String\n  createdAt DateTime @default(now())\n}",
        },
      ],
      resources: [
        {
          title: "Prisma Documentation",
          url: "https://www.prisma.io/docs/",
        },
      ],
      hasLab: true,
    },
    {
      title: "Error Handling and Validation",
      slug: "error-handling-validation",
      description:
        "Implement robust error handling and input validation with Zod.",
      sortOrder: 3,
      durationSeconds: 600,
      transcript: "Proper error handling is crucial for production APIs...",
      codeSnippets: [
        {
          label: "Zod validation",
          language: "typescript",
          code: "import { z } from 'zod';\n\nconst createUserSchema = z.object({\n  email: z.string().email(),\n  name: z.string().min(2).max(100),\n});\n\ntype CreateUserInput = z.infer<typeof createUserSchema>;",
        },
      ],
      resources: [],
    },
    {
      title: "Authentication with JWT",
      slug: "authentication-jwt",
      description:
        "Add JWT-based authentication to protect your API endpoints.",
      sortOrder: 4,
      durationSeconds: 840,
      transcript: "Let's secure our API with JSON Web Tokens...",
      codeSnippets: [
        {
          label: "Auth middleware",
          language: "typescript",
          code: "import jwt from 'jsonwebtoken';\n\nexport function authMiddleware(req, res, next) {\n  const token = req.headers.authorization?.split(' ')[1];\n  if (!token) return res.status(401).json({ error: 'Unauthorized' });\n\n  try {\n    const payload = jwt.verify(token, process.env.JWT_SECRET!);\n    req.user = payload;\n    next();\n  } catch {\n    res.status(401).json({ error: 'Invalid token' });\n  }\n}",
        },
      ],
      resources: [{ title: "JWT.io", url: "https://jwt.io/" }],
    },
  ];

  for (const lessonData of nodeLessons) {
    const { hasLab, ...lessonFields } = lessonData;
    const lesson = await prisma.lesson.upsert({
      where: {
        courseId_slug: { courseId: course2.id, slug: lessonData.slug },
      },
      update: { ...lessonFields },
      create: {
        ...lessonFields,
        courseId: course2.id,
        status: "PUBLISHED",
      },
    });

    if (hasLab) {
      const labPlan = {
        title: `${lesson.title} Lab`,
        description: `Hands-on practice for: ${lesson.title}`,
        dockerImage: "node:20-slim",
        memoryLimit: "256m",
        cpuLimit: "0.5",
        steps: [
          {
            title: "Initialize the database",
            instructions:
              "<p>Run the Prisma migration to set up your database schema.</p>",
            checks: [
              {
                name: "Migration applied",
                command: "test -d node_modules/.prisma && echo 'ok'",
                expected: "ok",
                hint: "Run npx prisma migrate dev first.",
              },
            ],
          },
          {
            title: "Create a user via the API",
            instructions:
              "<p>Use curl to create a user through your API endpoint.</p>",
            checks: [
              {
                name: "User created",
                command: "echo 'verified'",
                expected: "verified",
                hint: "POST to /api/users with email and name.",
              },
            ],
          },
        ],
      };

      await prisma.labDefinition.upsert({
        where: { lessonId: lesson.id },
        update: {},
        create: {
          lessonId: lesson.id,
          yamlSource: JSON.stringify(labPlan),
          compiledPlan: labPlan,
        },
      });
    }
  }
  console.log(
    `  ✓ Course "${course2.title}" with ${nodeLessons.length} lessons`
  );

  // ─── Course 3: IT Automation with Ansible ───────────
  const course3 = await prisma.course.upsert({
    where: { slug: "ansible-quickstart" },
    update: {},
    create: {
      title: "Master IT Automation with Ansible in 30 Minutes",
      slug: "ansible-quickstart",
      description:
        "A crash course in IT automation with Ansible, designed to give you the essential skills to start automating tasks and managing infrastructure in just 30 minutes. Perfect for busy professionals, this course focuses on practical, high-value techniques to achieve immediate results.",
      thumbnailUrl: "/images/courses/ansible-quickstart.svg",
      difficulty: "BEGINNER",
      status: "PUBLISHED",
      sortOrder: 2,
      outcomes: [
        "Install and set up Ansible in minutes",
        "Write and execute your first playbook",
        "Use core Ansible modules for automation",
        "Create a basic automated workflow to manage infrastructure",
      ],
      prerequisites: [
        "Beginners curious about IT automation",
        "Basic command line familiarity",
      ],
      estimatedDuration: 30,
    },
  });

  const ansibleLessons = [
    {
      title: "Introduction to Ansible",
      slug: "introduction-to-ansible",
      description:
        "Overview of Ansible, its benefits (agentless, YAML-based, idempotent), and real-world applications.",
      sortOrder: 0,
      durationSeconds: 158,
      videoPlaybackId: "pSBrSxIymfVHuQTpy4sYNorkvIHISxVhj4mNjhlu4bI",
      transcript:
        "Welcome to this quickstart on Ansible! Ansible is a powerful automation tool used by IT professionals to manage infrastructure. What makes it unique is its simplicity—no agents are required, and configurations are written in YAML, making it human-readable. In this course, you'll learn to install Ansible, create your first playbook, and automate a simple web server deployment—all in just 30 minutes. Let's get started!",
      codeSnippets: [],
      resources: [
        { title: "Ansible Documentation", url: "https://docs.ansible.com/" },
      ],
    },
    {
      title: "Installing and Configuring Ansible",
      slug: "installing-configuring-ansible",
      description:
        "Install Ansible on your machine, set up an inventory file, and test connectivity with ad-hoc commands.",
      sortOrder: 1,
      durationSeconds: 324,
      videoPlaybackId: "4Gj5SoXO02101M6k2vFztwApeaHi1iXlil01GtSWYM1802A",
      transcript:
        "First, we'll install Ansible. If you're using Linux or macOS, run this command. For macOS, install with brew. Windows users can use WSL or follow the installation guide on the Ansible website. Now, let's create an inventory file. Open a file called hosts and add your server details. Test the connection with ansible ping. Success? Great! You're ready for the next step.",
      codeSnippets: [
        {
          label: "Install on Debian/Ubuntu",
          language: "bash",
          code: "sudo apt update && sudo apt install ansible -y",
        },
        {
          label: "Install on macOS",
          language: "bash",
          code: "brew install ansible",
        },
        {
          label: "Inventory file (hosts)",
          language: "ini",
          code: "[web]\nyour_server_ip ansible_user=your_user",
        },
        {
          label: "Test connection",
          language: "bash",
          code: "ansible -i hosts all -m ping",
        },
      ],
      resources: [
        {
          title: "Ansible Installation Guide",
          url: "https://docs.ansible.com/ansible/latest/installation_guide/",
        },
      ],
    },
    {
      title: "Building Your First Playbook",
      slug: "building-first-playbook",
      description:
        "Step-by-step creation of a basic playbook to deploy and configure a web server (e.g., Nginx).",
      sortOrder: 2,
      durationSeconds: 410,
      videoPlaybackId: "QqgLJxDO41fqlOqGNs6MDO67MFPgre2rX7PSSvcIya8",
      transcript:
        "Now, let's create a playbook to install and configure a web server. Open a file called webserver.yml. We'll define tasks to install Nginx, start the service, and deploy a custom HTML file. Run the playbook with ansible-playbook. Check your browser—your web server is live!",
      codeSnippets: [
        {
          label: "Playbook (webserver.yml)",
          language: "yaml",
          code: "- hosts: web\n  become: true\n  tasks:\n    - name: Install Nginx\n      apt:\n        name: nginx\n        state: present\n\n    - name: Start Nginx service\n      service:\n        name: nginx\n        state: started\n        enabled: true\n\n    - name: Deploy a custom HTML file\n      copy:\n        src: /path/to/index.html\n        dest: /var/www/html/index.html",
        },
        {
          label: "Run the playbook",
          language: "bash",
          code: "ansible-playbook -i hosts webserver.yml",
        },
      ],
      resources: [
        {
          title: "Ansible Playbook Guide",
          url: "https://docs.ansible.com/ansible/latest/playbook_guide/",
        },
      ],
      hasLab: true,
    },
    {
      title: "Using Ansible Modules",
      slug: "using-ansible-modules",
      description:
        "Overview of essential modules (e.g., file, yum, service, copy) with quick demos.",
      sortOrder: 3,
      durationSeconds: 459,
      videoPlaybackId: "BsVCQ4r6YS017o6ivwD9DSC3FM00Y9GhKvndq019d57WAQ",
      transcript:
        "Ansible's power lies in its modules. Let's look at the most common ones: apt or yum for installing software, service for managing services, and copy for copying files. Use these modules to automate infrastructure tasks efficiently!",
      codeSnippets: [
        {
          label: "apt module — Install software",
          language: "yaml",
          code: "- name: Install Nginx\n  apt:\n    name: nginx\n    state: present",
        },
        {
          label: "service module — Manage services",
          language: "yaml",
          code: "- name: Start Nginx\n  service:\n    name: nginx\n    state: started",
        },
        {
          label: "copy module — Copy files",
          language: "yaml",
          code: "- name: Copy a file\n  copy:\n    src: local_file\n    dest: remote_path",
        },
      ],
      resources: [
        {
          title: "Ansible Module Index",
          url: "https://docs.ansible.com/ansible/latest/collections/index_module.html",
        },
      ],
    },
    {
      title: "Simple Automation Project",
      slug: "simple-automation-project",
      description:
        "Automate the deployment of a web server, secure it with a firewall, and share results.",
      sortOrder: 4,
      durationSeconds: 658,
      videoPlaybackId: "01m3402uRFFktlDx00X3whDGZPLFEvotRDSyE6D1B7yI6w",
      transcript:
        "For the final project, automate a web server deployment. You'll write a playbook to install a web server, copy an HTML file to /var/www/html, and ensure the server starts and is enabled on boot. Upload your project to the Project Gallery. Share your playbook, a screenshot of the successful run, and your thoughts on the process.",
      codeSnippets: [
        {
          label: "Complete project playbook",
          language: "yaml",
          code: "- hosts: web\n  become: true\n  tasks:\n    - name: Install Nginx\n      apt:\n        name: nginx\n        state: present\n\n    - name: Start Nginx\n      service:\n        name: nginx\n        state: started\n        enabled: true\n\n    - name: Deploy a web page\n      copy:\n        src: index.html\n        dest: /var/www/html/index.html",
        },
        {
          label: "Inventory file (hosts)",
          language: "ini",
          code: "[web]\n192.168.1.10 ansible_user=ubuntu",
        },
        {
          label: "HTML page (index.html)",
          language: "html",
          code: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Welcome to Ansible Automation!</title>\n</head>\n<body>\n    <h1>Your Web Server is Live!</h1>\n</body>\n</html>',
        },
      ],
      resources: [],
      hasLab: true,
    },
    {
      title: "Course Project Walkthrough",
      slug: "course-project-walkthrough",
      description:
        "Live walkthrough of the course project: deploying and verifying an automated web server with Ansible.",
      sortOrder: 5,
      durationSeconds: 254,
      videoPlaybackId: "nmu3Ufzo2lnsbUehGfnWTAidcIgLOJfmhvukXYEntMc",
      transcript:
        "In this final walkthrough, we'll run through the entire project end-to-end — from inventory setup to playbook execution. You'll see the automated deployment in action and verify the results in the browser. Congratulations—you've automated your first task with Ansible!",
      codeSnippets: [],
      resources: [],
    },
  ];

  for (const lessonData of ansibleLessons) {
    const { hasLab, ...lessonFields } = lessonData;
    const lesson = await prisma.lesson.upsert({
      where: {
        courseId_slug: { courseId: course3.id, slug: lessonData.slug },
      },
      update: { ...lessonFields },
      create: {
        ...lessonFields,
        courseId: course3.id,
        status: "PUBLISHED",
      },
    });

    if (hasLab) {
      const labPlan = {
        title: `${lesson.title} Lab`,
        description: `Hands-on practice for: ${lesson.title}`,
        dockerImage: "copypastelearn/ansible-lab:latest",
        memoryLimit: "256m",
        cpuLimit: "0.5",
        steps: [
          {
            title: "Create the inventory file",
            instructions:
              "<p>Create a file called <code>hosts</code> with your server details in INI format.</p>",
            checks: [
              {
                name: "Inventory exists",
                command: "test -f hosts && echo 'ok'",
                expected: "ok",
                hint: "Create a file called 'hosts' with [web] group.",
              },
            ],
          },
          {
            title: "Write the playbook",
            instructions:
              "<p>Create <code>webserver.yml</code> with tasks to install Nginx, start the service, and deploy an HTML file.</p>",
            checks: [
              {
                name: "Playbook exists",
                command: "test -f webserver.yml && echo 'ok'",
                expected: "ok",
                hint: "Create webserver.yml with at least 3 tasks.",
              },
            ],
          },
          {
            title: "Run the playbook",
            instructions:
              "<p>Execute your playbook with <code>ansible-playbook -i hosts webserver.yml</code> and verify the result.</p>",
            checks: [
              {
                name: "Playbook executed",
                command: "echo 'done'",
                expected: "done",
                hint: "Run ansible-playbook and check for errors.",
              },
            ],
          },
        ],
      };

      await prisma.labDefinition.upsert({
        where: { lessonId: lesson.id },
        update: {},
        create: {
          lessonId: lesson.id,
          yamlSource: JSON.stringify(labPlan),
          compiledPlan: labPlan,
        },
      });
    }
  }
  console.log(
    `  ✓ Course "${course3.title}" with ${ansibleLessons.length} lessons`
  );

  // ─── Course 4: OpenClaw in 60 Minutes ───────────────
  const course4 = await prisma.course.upsert({
    where: { slug: "openclaw-agent" },
    update: {},
    create: {
      title: "OpenClaw in 60 Minutes: Build & Secure Your First Autonomous Agent",
      slug: "openclaw-agent",
      description:
        "Deploy OpenClaw locally or on a small VPS, add real tools, create one reusable automation, and apply essential security guardrails. You'll leave with a working 'Ops Assistant' that generates a Daily Brief, creates an Action Queue, and does it all safely.",
      thumbnailUrl: "/images/courses/openclaw-agent.svg",
      difficulty: "BEGINNER",
      status: "DRAFT",
      sortOrder: 3,
      outcomes: [
        "Install and run OpenClaw (local Docker or VPS)",
        "Configure identity/memory and a sane default agent profile",
        "Connect 2 real tools (web/search + one work integration like email/Slack)",
        "Build one end-to-end automation (Daily Brief + Action Queue)",
        "Apply essential security: secrets, allowlists, prompt-injection safety check",
        "Create a simple ops routine: logs, updates, backup/restore",
      ],
      prerequisites: [
        "Basic terminal comfort (copy/paste commands)",
        "A machine with Docker or a small Linux VM",
        "Optional: API keys for your chosen tools (we provide a no-keys fallback path)",
      ],
      estimatedDuration: 60,
    },
  });

  const openclawLessons = [
    {
      title: "Outcome + Architecture",
      slug: "outcome-architecture",
      description:
        "What we're building (Daily Brief + Action Queue). Mental model: agent loop, memory, tools, skills, guardrails. Minimum viable autonomy — safe-by-default.",
      sortOrder: 0,
      durationSeconds: 212,
      videoPlaybackId: "GdjK5NvuBS01Oy619NAHUtQf2S2MKoSYPn1CgFuVs5YI",
      transcript:
        "Welcome to OpenClaw in 60 Minutes! In this course you'll deploy OpenClaw, harden it with practical guardrails, connect real tools, and ship a working Ops Assistant automation you can reuse at work. Let's start with the architecture. OpenClaw follows an agent loop pattern: the agent reads its memory, decides what to do, uses tools through a skills layer, and operates within guardrails you define. By the end of this course you'll have a working Daily Brief plus Action Queue pipeline. The key principle is minimum viable autonomy — safe by default.",
      codeSnippets: [
        {
          label: "Agent architecture overview",
          language: "text",
          code: "Agent Loop:\n  1. Read memory (about_me.md + operating_rules.md)\n  2. Decide action (LLM reasoning)\n  3. Execute via tools (web/search, email/Slack)\n  4. Log results + update memory\n  5. Respect guardrails (allowlists, secrets hygiene)",
        },
      ],
      resources: [
        { title: "OpenClaw GitHub", url: "https://github.com/openclaw" },
      ],
    },
    {
      title: "Fast Deploy: Docker Local or Ubuntu VM on Azure",
      slug: "fast-deploy-docker-or-vm",
      description:
        "Option A: Docker run (fastest). Option B: small Ubuntu VM (same config, different ports). Smoke test: agent replies + health check.",
      sortOrder: 1,
      durationSeconds: 600,
      videoPlaybackId: "5VKTlA9MgyWHjc01cvy00WSxiIP1E3XmY6fG6ep4003o1g",
      transcript:
        "Let's get OpenClaw running. You have two options. Option A is Docker — pull the image and run it. This is the fastest path. Option B is a small Ubuntu VM, which is useful if you want a persistent deployment. Either way, the configuration is identical, just different ports. Once it's running, we'll do a smoke test: send a message to the agent and verify the health endpoint responds.",
      codeSnippets: [
        {
          label: "Option A: Docker run (fastest)",
          language: "bash",
          code: "docker pull openclaw/openclaw:latest\ndocker run -d \\\n  --name openclaw \\\n  -p 8080:8080 \\\n  -v openclaw-data:/data \\\n  openclaw/openclaw:latest",
        },
        {
          label: "Option B: Ubuntu VM setup",
          language: "bash",
          code: "# On a fresh Ubuntu 22.04 VM\nsudo apt update && sudo apt install -y docker.io\nsudo systemctl enable --now docker\nsudo docker pull openclaw/openclaw:latest\nsudo docker run -d \\\n  --name openclaw \\\n  --restart unless-stopped \\\n  -p 8080:8080 \\\n  -v openclaw-data:/data \\\n  openclaw/openclaw:latest",
        },
        {
          label: "Smoke test",
          language: "bash",
          code: "# Health check\ncurl http://localhost:8080/health\n\n# Send a test message\ncurl -X POST http://localhost:8080/api/chat \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"message\": \"Hello, are you running?\"}'",
        },
      ],
      resources: [
        { title: "Docker Install Guide", url: "https://docs.docker.com/get-docker/" },
      ],
    },
    {
      title: "AI Models Troubleshooting",
      slug: "ai-models-troubleshooting",
      description:
        "Configuring LLM providers, testing model connectivity, and common troubleshooting steps for API keys and rate limits.",
      sortOrder: 2,
      durationSeconds: 241,
      videoPlaybackId: "V8lijLkbJ8qeiZd8VHHsSwiUYAQuRq59eXtdwEnd8gc",
      transcript:
        "Now that OpenClaw is running, let's configure the AI model backend. OpenClaw supports multiple LLM providers. You'll need an API key — we'll walk through where to get one, how to set it, and the most common issues: wrong key format, rate limits, and model availability. We also cover the no-keys fallback path using a local model.",
      codeSnippets: [
        {
          label: "Configure LLM provider",
          language: "bash",
          code: "# Set environment variable for your provider\ndocker exec openclaw \\\n  openclaw config set llm.provider openai\n\ndocker exec openclaw \\\n  openclaw config set llm.api_key sk-YOUR_KEY_HERE\n\ndocker exec openclaw \\\n  openclaw config set llm.model gpt-4o-mini",
        },
        {
          label: "Test model connectivity",
          language: "bash",
          code: "docker exec openclaw openclaw test-model\n# Expected: \"Model connected: gpt-4o-mini (latency: 230ms)\"",
        },
        {
          label: "No-keys fallback (local model)",
          language: "bash",
          code: "# Use a local model via Ollama\ndocker exec openclaw \\\n  openclaw config set llm.provider ollama\ndocker exec openclaw \\\n  openclaw config set llm.endpoint http://host.docker.internal:11434",
        },
        {
          label: "Common troubleshooting",
          language: "bash",
          code: "# Check logs for API errors\ndocker logs openclaw --tail 50 | grep -i error\n\n# Verify API key format\ndocker exec openclaw openclaw config get llm.api_key\n\n# Test with a simple prompt\ndocker exec openclaw openclaw ask \"What is 2+2?\"",
        },
      ],
      resources: [],
    },
    {
      title: "Identity + Memory That Doesn't Rot",
      slug: "identity-memory",
      description:
        "Define role, tone, boundaries (what I can/can't do). Create 2 memory files: about_me.md (user/org context) and operating_rules.md (safety + permissions). Quick test prompt to validate memory usage.",
      sortOrder: 3,
      durationSeconds: 480,
      transcript:
        "Your agent needs an identity — who it is, what it can and can't do. We'll create two memory files. about_me.md holds context about you and your organization. operating_rules.md defines safety boundaries and permissions. Together, these prevent memory rot — the agent always knows its boundaries even after many conversations.",
      codeSnippets: [
        {
          label: "about_me.md",
          language: "markdown",
          code: "# About Me\n\n## Owner\n- Name: Your Name\n- Role: DevOps Engineer at Acme Corp\n\n## Organization Context\n- We run a microservices stack on Kubernetes\n- Primary language: Python + TypeScript\n- Monitoring: Grafana + PagerDuty\n\n## Preferences\n- Prefer concise, actionable answers\n- Always include the \"why\" not just the \"how\"",
        },
        {
          label: "operating_rules.md",
          language: "markdown",
          code: "# Operating Rules\n\n## I CAN\n- Search the web for technical information\n- Draft emails and messages (never send without approval)\n- Read and summarize documents\n- Create action items and task lists\n\n## I CANNOT\n- Execute destructive commands (rm -rf, DROP TABLE, etc.)\n- Access production databases directly\n- Send messages/emails without explicit approval\n- Share secrets, tokens, or credentials in any output\n\n## Safety\n- All tool calls are logged\n- Allowlist-only for external URLs\n- Prompt injection detection is enabled",
        },
        {
          label: "Load memory files",
          language: "bash",
          code: "docker cp about_me.md openclaw:/data/memory/about_me.md\ndocker cp operating_rules.md openclaw:/data/memory/operating_rules.md\n\n# Test that memory is loaded\ndocker exec openclaw openclaw ask \"What are your operating rules?\"",
        },
      ],
      resources: [],
    },
    {
      title: "Connect Tools",
      slug: "connect-tools",
      description:
        "Tool 1: Web/search (or a stubbed offline search fallback). Tool 2: One of email draft, Slack/Telegram post, or local command tool with strict allowlist. Principle: least privilege + separate credentials.",
      sortOrder: 4,
      durationSeconds: 600,
      videoPlaybackId: "2EMm02SxsltoTW76cP7ajjEXu012zqa7Fu6AakVP00Xw5E",
      transcript:
        "Now let's give the agent real capabilities. We'll connect two tools. Tool one is web search — this lets the agent look things up. If you don't have an API key, we provide an offline fallback. Tool two is a work integration: pick email draft, Slack post, or a local command tool. The key principle is least privilege — each tool gets its own credentials and a strict allowlist.",
      codeSnippets: [
        {
          label: "Tool 1: Web search",
          language: "bash",
          code: "# Configure web search tool\ndocker exec openclaw \\\n  openclaw tools enable web-search\n\n# Optional: set a search API key\ndocker exec openclaw \\\n  openclaw tools config web-search api_key YOUR_SEARCH_KEY\n\n# Fallback: offline/stubbed search\ndocker exec openclaw \\\n  openclaw tools config web-search mode offline",
        },
        {
          label: "Tool 2a: Email draft",
          language: "bash",
          code: "docker exec openclaw \\\n  openclaw tools enable email-draft\n\ndocker exec openclaw \\\n  openclaw tools config email-draft \\\n    smtp_host smtp.gmail.com \\\n    smtp_port 587 \\\n    from_address your@email.com\n\n# IMPORTANT: drafts only, no auto-send\ndocker exec openclaw \\\n  openclaw tools config email-draft mode draft-only",
        },
        {
          label: "Tool 2b: Slack post",
          language: "bash",
          code: "docker exec openclaw \\\n  openclaw tools enable slack-post\n\ndocker exec openclaw \\\n  openclaw tools config slack-post \\\n    webhook_url https://hooks.slack.com/services/YOUR/WEBHOOK/URL \\\n    channel \"#ops-updates\"\n\n# Restrict to specific channels\ndocker exec openclaw \\\n  openclaw tools config slack-post \\\n    allowed_channels \"#ops-updates,#daily-brief\"",
        },
        {
          label: "Tool 2c: Local command (strict allowlist)",
          language: "bash",
          code: "docker exec openclaw \\\n  openclaw tools enable local-cmd\n\n# ONLY these commands are allowed\ndocker exec openclaw \\\n  openclaw tools config local-cmd \\\n    allowlist \"uptime,df -h,free -m,docker ps,systemctl status nginx\"",
        },
        {
          label: "Verify tools",
          language: "bash",
          code: "docker exec openclaw openclaw tools list\n# Expected: web-search (enabled), email-draft (enabled), ...",
        },
      ],
      resources: [],
    },
    {
      title: "Build the Automation: Daily Brief + Action Queue",
      slug: "daily-brief-action-queue",
      description:
        "Define the workflow contract. Build the Daily Brief (status + top priorities). Create the Action Queue (next steps). Optionally post to chat or draft an email. Run it safely with guardrails + minimal permissions.",
      sortOrder: 5,
      durationSeconds: 900,
      transcript:
        "This is the capstone — we'll build the Ops Assistant end-to-end. The workflow has four steps: gather status data, generate a Daily Brief with priorities, create an Action Queue of next steps, and optionally push the output to Slack or email. Everything runs within the guardrails we set up earlier. By the end of this lecture, you'll have a fully working automation you can schedule with cron.",
      codeSnippets: [
        {
          label: "Workflow definition (daily-brief.yaml)",
          language: "yaml",
          code: "name: daily-brief\nschedule: \"0 8 * * *\"  # Every day at 8 AM\nsteps:\n  - name: gather-status\n    prompt: |\n      Check system status: run uptime, check disk space,\n      and list running Docker containers.\n      Summarize in 3 bullet points.\n\n  - name: generate-brief\n    prompt: |\n      Based on the system status, create a Daily Brief with:\n      1. Current status (green/yellow/red)\n      2. Top 3 priorities for today\n      3. Any alerts or warnings\n\n  - name: create-action-queue\n    prompt: |\n      From the Daily Brief, create an Action Queue:\n      - List concrete next steps (max 5)\n      - Assign priority (P0/P1/P2)\n      - Include estimated time for each\n\n  - name: deliver\n    action: slack-post  # or email-draft\n    channel: \"#daily-brief\"\n    format: markdown",
        },
        {
          label: "Register and test the workflow",
          language: "bash",
          code: "# Copy workflow file\ndocker cp daily-brief.yaml openclaw:/data/workflows/daily-brief.yaml\n\n# Register it\ndocker exec openclaw openclaw workflow register daily-brief\n\n# Run once manually to test\ndocker exec openclaw openclaw workflow run daily-brief\n\n# Check output\ndocker exec openclaw openclaw workflow logs daily-brief --last",
        },
        {
          label: "Schedule with cron (optional)",
          language: "bash",
          code: "# Enable built-in scheduler\ndocker exec openclaw openclaw workflow schedule daily-brief\n\n# Or use system cron\ncrontab -e\n# Add: 0 8 * * * docker exec openclaw openclaw workflow run daily-brief",
        },
        {
          label: "Security checklist",
          language: "text",
          code: "✅ Secrets stored in /data/secrets (not in workflow YAML)\n✅ Tool allowlists configured\n✅ Prompt injection check enabled\n✅ Draft-only mode for email (no auto-send)\n✅ Logs written to /data/logs/\n✅ Memory files are read-only for workflows",
        },
      ],
      resources: [],
    },
    {
      title: "Operate It: Logs, Backups, Updates & Safe Iteration",
      slug: "operate-logs-backups-updates",
      description:
        "Day-2 operations: viewing logs, backing up agent data, updating OpenClaw, and safely iterating on workflows and memory.",
      sortOrder: 6,
      durationSeconds: 480,
      transcript:
        "You've built a working Ops Assistant. Now let's make sure you can operate it. We'll cover four things: reading logs to debug issues, backing up your agent data, updating OpenClaw safely, and iterating on your workflows without breaking things. These are the basics that most short courses skip, but they're essential for running an agent in production.",
      codeSnippets: [
        {
          label: "View and filter logs",
          language: "bash",
          code: "# Recent logs\ndocker logs openclaw --tail 100\n\n# Filter by level\ndocker logs openclaw 2>&1 | grep -E '(ERROR|WARN)'\n\n# Workflow-specific logs\ndocker exec openclaw \\\n  openclaw workflow logs daily-brief --last 5",
        },
        {
          label: "Backup agent data",
          language: "bash",
          code: "# Backup entire data volume\ndocker run --rm \\\n  -v openclaw-data:/data \\\n  -v $(pwd)/backups:/backup \\\n  alpine tar czf /backup/openclaw-$(date +%F).tar.gz -C /data .\n\n# Verify backup\nls -lh backups/",
        },
        {
          label: "Update OpenClaw",
          language: "bash",
          code: "# Pull latest image\ndocker pull openclaw/openclaw:latest\n\n# Stop, remove, re-run (data persists in volume)\ndocker stop openclaw && docker rm openclaw\ndocker run -d \\\n  --name openclaw \\\n  --restart unless-stopped \\\n  -p 8080:8080 \\\n  -v openclaw-data:/data \\\n  openclaw/openclaw:latest\n\n# Verify\ncurl http://localhost:8080/health",
        },
        {
          label: "Safe iteration on workflows",
          language: "bash",
          code: "# Test a workflow change without affecting the live version\ndocker exec openclaw \\\n  openclaw workflow run daily-brief --dry-run\n\n# Review the output before committing\ndocker exec openclaw \\\n  openclaw workflow logs daily-brief --last\n\n# Promote the change\ndocker exec openclaw \\\n  openclaw workflow register daily-brief",
        },
      ],
      resources: [],
    },
  ];

  for (const lessonData of openclawLessons) {
    const lesson = await prisma.lesson.upsert({
      where: {
        courseId_slug: { courseId: course4.id, slug: lessonData.slug },
      },
      update: { ...lessonData },
      create: {
        ...lessonData,
        courseId: course4.id,
        status: "DRAFT",
      },
    });
  }
  console.log(
    `  ✓ Course "${course4.title}" with ${openclawLessons.length} lessons`
  );

  console.log("\n✅ Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
