/**
 * goose and AGENTS.md course seed (DRAFT).
 *
 * "Run Coding Agents in Production with goose and AGENTS.md" with six lessons.
 *
 * Idempotent, same style as the kagent course seed and the courses in prisma/seed.ts:
 *   - the course upsert has `update: {}`, so re-running never resets a status
 *     or a field that was edited in the admin after the first run;
 *   - lesson upserts refresh the text fields only. They do not set `status`,
 *     `videoPlaybackId` or `durationSeconds`: lessons are created as DRAFT with
 *     no video, and a re-run never overwrites a Mux playback ID that was added
 *     later.
 *
 * NOT wired into prisma/seed.ts yet (the three Agentic AI Academy courses are wired together later).
 * To seed only this course, run prisma/seed.goose.ts.
 *
 * The code snippets are the lab files and the commands of the course, copied as they are, except for the
 * final newline of each file (screenshare-recorder: lessons/goose). Lesson sortOrder starts at 0: the first
 * lesson is free to view.
 */

import type { PrismaClient } from "@prisma/client";

export const GOOSE_COURSE_SLUG = "coding-agents-in-production-goose-agents-md";

export const gooseLessons = [
  {
    title: "Install goose and connect a model",
    slug: "install-goose-and-connect-a-model",
    description: "Install goose 1.57.0 with the pinned installer, connect it to a model through an environment variable, enable two extensions in config.yaml, and run a first task.",
    sortOrder: 0,
    codeSnippets: [
      {
        label: "Install goose (pinned version)",
        language: "bash",
        code: "curl -fsSL https://github.com/aaif-goose/goose/releases/download/v1.57.0/download_cli.sh \\\n  | GOOSE_VERSION=v1.57.0 CONFIGURE=false bash"
      },
      {
        label: "Configuration (config.yaml)",
        language: "yaml",
        code: "active_provider: openai\nproviders:\n  openai:\n    enabled: true\n    model: gpt-4.1-mini\n    configured: true\nGOOSE_TELEMETRY_ENABLED: false\nextensions:\n  developer:\n    type: builtin\n    name: developer\n    enabled: true\n    bundled: true\n    timeout: 300\n  todo:\n    type: platform\n    name: todo\n    enabled: true\n    bundled: true"
      },
      {
        label: "Check the provider connection",
        language: "bash",
        code: "goose info --check"
      },
    ],
    resources: [
      {
        title: "goose docs: Install goose",
        url: "https://goose-docs.ai/docs/getting-started/installation"
      },
      {
        title: "goose docs: Configure a provider and a model",
        url: "https://goose-docs.ai/docs/getting-started/providers"
      },
      {
        title: "goose docs: Using extensions",
        url: "https://goose-docs.ai/docs/getting-started/using-extensions"
      },
      {
        title: "goose on GitHub",
        url: "https://github.com/aaif-goose/goose"
      },
    ]
  },
  {
    title: "Write an AGENTS.md that changes what the agent does",
    slug: "agents-md-changes-what-the-agent-does",
    description: "Run the same task on a small repository before and after adding an AGENTS.md, compare the results with git, and confirm in goose's request log that the file was sent to the model.",
    sortOrder: 1,
    codeSnippets: [
      {
        label: "AGENTS.md",
        language: "markdown",
        code: "# AGENTS.md\n\n## Code style\n- Every function has type hints and a one-line docstring.\n\n## Testing\n- Run tests with `python3 -m unittest discover -s tests`.\n- Run the tests after every change and fix failures before you finish.\n\n## Changes\n- Add one line under \"Unreleased\" in CHANGELOG.md for every change."
      },
      {
        label: "The same task, twice",
        language: "bash",
        code: "goose run -q -t \"Add a function title_case(text) to textkit/words.py, with a test.\""
      },
      {
        label: "Proof that goose received the file",
        language: "bash",
        code: "grep -l \"one-line docstring\" ~/.local/state/goose/logs/llm_request.*.jsonl | head -n 1"
      },
    ],
    resources: [
      {
        title: "AGENTS.md: a simple, open format for guiding coding agents",
        url: "https://agents.md"
      },
      {
        title: "AGENTS.md on GitHub",
        url: "https://github.com/agentsmd/agents.md"
      },
      {
        title: "goose docs: Using goosehints and AGENTS.md",
        url: "https://goose-docs.ai/docs/guides/context-engineering/using-goosehints"
      },
      {
        title: "Agentic AI Foundation",
        url: "https://aaif.io"
      },
    ]
  },
  {
    title: "Sessions, context, and where instructions live",
    slug: "goose-sessions-context-and-hints",
    description: "Name, list and resume sessions, read the context usage with /status, compact a long conversation, and see how global hints and a project AGENTS.md reach the model together.",
    sortOrder: 2,
    codeSnippets: [
      {
        label: "Start a named session",
        language: "bash",
        code: "goose session -n review-textkit"
      },
      {
        label: "Resume it, with the earlier messages",
        language: "bash",
        code: "goose session --resume -n review-textkit --history"
      },
      {
        label: "Global hints (~/.config/goose/.goosehints)",
        language: "text",
        code: "Keep answers short and use plain words."
      },
      {
        label: "Count the hint sections the model received",
        language: "bash",
        code: "grep -oh '### [A-Z][a-z]* Hints' ~/.local/state/goose/logs/llm_request.*.jsonl | sort | uniq -c"
      },
    ],
    resources: [
      {
        title: "goose docs: Session management",
        url: "https://goose-docs.ai/docs/guides/sessions/session-management"
      },
      {
        title: "goose docs: Smart context management",
        url: "https://goose-docs.ai/docs/guides/sessions/smart-context-management"
      },
      {
        title: "goose docs: Configuration files",
        url: "https://goose-docs.ai/docs/guides/config-files"
      },
      {
        title: "goose docs: CLI commands",
        url: "https://goose-docs.ai/docs/guides/goose-cli-commands"
      },
    ]
  },
  {
    title: "Recipes and headless runs",
    slug: "recipes-and-headless-runs",
    description: "Package a task as a recipe with a required parameter, validate it, run it without a person, and learn why the exit code alone is not proof that the work was done.",
    sortOrder: 3,
    codeSnippets: [
      {
        label: "Recipe (todo-report.yaml)",
        language: "yaml",
        code: "version: 1.0.0\ntitle: TODO report\ndescription: Collect the TODO comments of a Python project into a Markdown report\nparameters:\n  - key: folder\n    input_type: string\n    requirement: required\n    description: Folder to scan\ninstructions: |\n  You write short reports. Use only the shell and write tools.\n  Never change source files.\nprompt: |\n  Write a TODO report for the folder {{ folder }}. List every TODO\n  comment with its file and line, and save it as TODO_REPORT.md.\nextensions:\n  - type: builtin\n    name: developer"
      },
      {
        label: "Run it with a parameter",
        language: "bash",
        code: "goose run --recipe todo-report.yaml --params folder=textkit"
      },
      {
        label: "A turn limit, and checking the result",
        language: "bash",
        code: "goose run -q --max-turns 1 --recipe todo-report.yaml --params folder=textkit; echo \"exit code: $?\""
      },
    ],
    resources: [
      {
        title: "goose docs: Recipe reference",
        url: "https://goose-docs.ai/docs/guides/recipes/recipe-reference"
      },
      {
        title: "goose docs: Running tasks",
        url: "https://goose-docs.ai/docs/guides/running-tasks"
      },
      {
        title: "goose docs: CLI commands",
        url: "https://goose-docs.ai/docs/guides/goose-cli-commands"
      },
    ]
  },
  {
    title: "Run goose in CI with GitHub Actions",
    slug: "run-goose-in-ci-github-actions",
    description: "Write a GitHub Actions workflow that installs a pinned goose, runs a recipe, checks the result and exports the session, lint it with actionlint, and run the same steps locally.",
    sortOrder: 4,
    codeSnippets: [
      {
        label: "Workflow (.github/workflows/todo-report.yml)",
        language: "yaml",
        code: "name: TODO report\non:\n  pull_request:\n  workflow_dispatch:\npermissions:\n  contents: read\njobs:\n  report:\n    runs-on: ubuntu-latest\n    timeout-minutes: 10\n    env:\n      GOOSE_PROVIDER: openai\n      GOOSE_MODEL: gpt-4.1-mini\n      GOOSE_MODE: auto\n      GOOSE_DISABLE_KEYRING: \"1\"\n      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}\n    steps:\n      - uses: actions/checkout@v7\n      - name: Install goose\n        run: |\n          URL=https://github.com/aaif-goose/goose/releases/download/v1.57.0\n          curl -fsSL \"$URL/download_cli.sh\" | GOOSE_VERSION=v1.57.0 CONFIGURE=false bash\n          echo \"$HOME/.local/bin\" >> \"$GITHUB_PATH\"\n      - name: Run the recipe\n        run: goose run -q -n ci-report --recipe todo-report.yaml --params folder=textkit\n      - name: Check that the report exists\n        run: test -s TODO_REPORT.md\n      - name: Export the session\n        if: always()\n        run: goose session export -n ci-report -o session.md\n      - uses: actions/upload-artifact@v7\n        if: always()\n        with:\n          name: goose-report\n          path: |\n            TODO_REPORT.md\n            session.md"
      },
      {
        label: "Lint the workflow",
        language: "bash",
        code: "actionlint; echo \"exit code: $?\""
      },
      {
        label: "Run the job's recipe step locally",
        language: "bash",
        code: "goose run -q -n ci-report --recipe todo-report.yaml --params folder=textkit"
      },
      {
        label: "Export the session as a record",
        language: "bash",
        code: "goose session export -n ci-report -o session.md"
      },
    ],
    resources: [
      {
        title: "goose docs: Running tasks",
        url: "https://goose-docs.ai/docs/guides/running-tasks"
      },
      {
        title: "goose docs: Environment variables",
        url: "https://goose-docs.ai/docs/guides/environment-variables"
      },
      {
        title: "actionlint on GitHub",
        url: "https://github.com/rhysd/actionlint"
      },
      {
        title: "goose releases",
        url: "https://github.com/aaif-goose/goose/releases"
      },
    ]
  },
  {
    title: "Guardrails and a record of what the agent did",
    slug: "goose-guardrails-and-session-records",
    description: "See why approve mode fails in a headless run, block destructive shell commands with a PreToolUse hook, restrict a recipe to read-only tools, and keep an exported session as the record, with the limits stated honestly.",
    sortOrder: 5,
    codeSnippets: [
      {
        label: "Hook plugin manifest (plugin.json)",
        language: "json",
        code: "{\n  \"name\": \"guard\",\n  \"version\": \"0.1.0\",\n  \"description\": \"Block destructive shell commands\"\n}"
      },
      {
        label: "Hook configuration (hooks.json)",
        language: "json",
        code: "{\n  \"hooks\": {\n    \"PreToolUse\": [\n      {\n        \"matcher\": \"^shell$\",\n        \"hooks\": [\n          {\n            \"type\": \"command\",\n            \"command\": \"${PLUGIN_ROOT}/scripts/block-destructive.sh\",\n            \"on_failure\": \"block\"\n          }\n        ]\n      }\n    ]\n  }\n}"
      },
      {
        label: "Hook script (block-destructive.sh)",
        language: "bash",
        code: "#!/usr/bin/env bash\npayload=\"$(cat)\"\nif printf '%s' \"$payload\" | grep -Eq 'rm +-[a-z]*r|sudo |git push'; then\n  printf '{\"decision\":\"block\",\"reason\":\"destructive command blocked by project policy\"}'\nfi"
      },
      {
        label: "Read-only recipe (reviewer.yaml)",
        language: "yaml",
        code: "version: 1.0.0\ntitle: Read-only reviewer\ndescription: Look at the project and describe it, without being able to change anything\nprompt: What is in this folder? List the main files in two sentences.\nextensions:\n  - type: builtin\n    name: developer\n    available_tools: [tree, analyze]"
      },
      {
        label: "Export the guarded session",
        language: "bash",
        code: "goose session export -n guard-demo -o guard-demo.md"
      },
    ],
    resources: [
      {
        title: "goose docs: Permission modes",
        url: "https://goose-docs.ai/docs/guides/managing-tools/goose-permissions"
      },
      {
        title: "goose docs: Hooks",
        url: "https://goose-docs.ai/docs/guides/context-engineering/hooks"
      },
      {
        title: "goose docs: Logging system",
        url: "https://goose-docs.ai/docs/guides/logs"
      },
      {
        title: "goose docs: Recipe reference",
        url: "https://goose-docs.ai/docs/guides/recipes/recipe-reference"
      },
    ]
  },
];

export async function seedGooseCourse(prisma: PrismaClient) {
  const course = await prisma.course.upsert({
    where: { slug: GOOSE_COURSE_SLUG },
    update: {},
    create: {
      title: "Run Coding Agents in Production with goose and AGENTS.md",
      slug: GOOSE_COURSE_SLUG,
      description:
        "Install goose, teach it your project's rules with AGENTS.md, then run it the way a team does: recipes, CI, guardrails and a record of what it did.",
      difficulty: "INTERMEDIATE",
      status: "DRAFT",
      sortOrder: 7,
      outcomes: [
        "Install a pinned goose and connect it to a model and to extensions",
        "Write an AGENTS.md that measurably changes what the agent does, and prove goose received it",
        "Use sessions, context commands, and global versus project instructions",
        "Package repeatable work as a recipe and run it without a person",
        "Run goose in GitHub Actions and validate the workflow with actionlint",
        "Set guardrails with a hook and a read-only recipe, keep a session export as the record, and know the limits",
      ],
      prerequisites: [
        "Comfortable in a terminal and with git",
        "Python 3 and git installed (the practice repository is a small Python project)",
        "An API key for a model provider (the course uses OpenAI)",
        "A GitHub repository, for the CI lesson (optional)",
      ],
      estimatedDuration: 35,
    },
  });

  for (const lessonData of gooseLessons) {
    await prisma.lesson.upsert({
      where: {
        courseId_slug: { courseId: course.id, slug: lessonData.slug },
      },
      update: { ...lessonData },
      create: {
        ...lessonData,
        courseId: course.id,
        status: "DRAFT",
      },
    });
  }

  console.log(
    `  ✓ Course "${course.title}" (DRAFT) with ${gooseLessons.length} lessons`
  );
}
