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
      update: {},
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
      update: {},
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
      videoPlaybackId: "LSfDw0001oFCMmfJ01mabZ9h201V8os00PgumnGcBRE12XHA",
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
      videoPlaybackId: "qmw5QJczu2WjWcSxhyxOb7idsdMdclw5sxO2s29nvmQ",
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
      videoPlaybackId: "02ZcrKlQmJx013eEWDZck7TPznY9NUraUo005Zmao201GSA",
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
      videoPlaybackId: "TozvrFdDifmf1DLVZ9dF1PWn00bUgsKdGEZ02y01eve6AI",
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
      videoPlaybackId: "5xmz6u8C6I9LzUHM2KGtPHC9mj00YfIIq02atBDglhNRA",
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
      videoPlaybackId: "fsCcqW28WIbzBlobrNCqSRJNfjSxv7GU02xrfQ1O00iC8",
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
      update: {},
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
        dockerImage: "ubuntu:22.04",
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
