import { Terminal } from "lucide-react";

interface TerminalLine {
  prompt?: boolean;
  text: string;
  highlight?: boolean;
}

const courseTerminals: Record<string, TerminalLine[]> = {
  "docker-fundamentals": [
    { prompt: true, text: "docker run -d -p 8080:80 nginx" },
    { text: "Unable to find image 'nginx:latest' locally" },
    { text: "latest: Pulling from library/nginx" },
    { text: "Status: Downloaded newer image for nginx:latest", highlight: true },
    { prompt: true, text: "docker ps" },
    { text: "CONTAINER ID  IMAGE  STATUS        PORTS" },
    { text: "a1b2c3d4e5f6  nginx  Up 2 seconds  0.0.0.0:8080->80/tcp", highlight: true },
    { prompt: true, text: "curl localhost:8080" },
    { text: "Welcome to nginx!", highlight: true },
  ],
  "ansible-quickstart": [
    { prompt: true, text: "ansible-playbook site.yml -i inventory" },
    { text: "" },
    { text: "PLAY [Configure web servers] *************" },
    { text: "" },
    { text: "TASK [Install nginx] *********************" },
    { text: "changed: [web01]", highlight: true },
    { text: "changed: [web02]", highlight: true },
    { text: "" },
    { text: "PLAY RECAP ********************************" },
    { text: "web01: ok=3  changed=2  failed=0", highlight: true },
    { text: "web02: ok=3  changed=2  failed=0", highlight: true },
  ],
  "nodejs-rest-apis": [
    { prompt: true, text: "npm run dev" },
    { text: "Server running on http://localhost:3000", highlight: true },
    { prompt: true, text: 'curl -X POST localhost:3000/api/users \\' },
    { text: '  -H "Content-Type: application/json" \\' },
    { text: '  -d \'{"name":"Alice","email":"alice&#64;dev.io"}\'' },
    { text: '{"id":1,"name":"Alice","status":"created"}', highlight: true },
  ],
  "terraform-beginners": [
    { prompt: true, text: "terraform init" },
    { text: "Initializing provider plugins..." },
    { text: "Terraform has been successfully initialized!", highlight: true },
    { prompt: true, text: "terraform plan" },
    { text: "Plan: 3 to add, 0 to change, 0 to destroy.", highlight: true },
    { prompt: true, text: "terraform apply -auto-approve" },
    { text: "aws_instance.web: Creating..." },
    { text: "aws_instance.web: Creation complete [id=i-0abc123]", highlight: true },
    { text: "" },
    { text: "Apply complete! Resources: 3 added.", highlight: true },
  ],
  "mlflow-kubernetes-mlops": [
    { prompt: true, text: "mlflow run . --experiment-name fraud-detection" },
    { text: "Running entry point main..." },
    { text: "Logged metrics: accuracy=0.94, f1=0.91", highlight: true },
    { prompt: true, text: "mlflow models serve -m runs:/abc123/model -p 5001" },
    { text: "Serving model at http://localhost:5001", highlight: true },
    { prompt: true, text: "kubectl get pods -n mlflow" },
    { text: "NAME                      READY  STATUS" },
    { text: "mlflow-server-7f8d9-x2k   1/1    Running", highlight: true },
  ],
  "openclaw-agent": [
    { prompt: true, text: "openclaw init my-agent" },
    { text: "✓ Created agent workspace", highlight: true },
    { prompt: true, text: "openclaw run" },
    { text: "Agent connected to gateway..." },
    { text: "Listening for messages on #general", highlight: true },
    { prompt: true, text: 'openclaw skill add weather' },
    { text: "✓ Installed skill: weather (v1.2.0)", highlight: true },
  ],
  "selinux-system-admins": [
    { prompt: true, text: "getenforce" },
    { text: "Enforcing", highlight: true },
    { prompt: true, text: "ls -Z /var/www/html/index.html" },
    { text: "system_u:object_r:httpd_sys_content_t:s0 index.html", highlight: true },
    { prompt: true, text: "ausearch -m avc -ts recent" },
    { text: 'type=AVC msg=denied { read } for comm="httpd"' },
    { prompt: true, text: "setsebool -P httpd_read_user_content on" },
    { text: "# Access granted ✓", highlight: true },
  ],
};

export function TerminalPreview({ courseSlug }: { courseSlug: string }) {
  const lines = courseTerminals[courseSlug];
  if (!lines) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <Terminal className="h-5 w-5 text-primary" />
        What it looks like in the lab
      </h2>
      <div className="overflow-hidden rounded-lg border border-border/50 bg-[#0d1117]">
        {/* Title bar */}
        <div className="flex items-center gap-1.5 border-b border-white/10 bg-[#161b22] px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-xs text-white/40">sandbox — bash</span>
        </div>
        {/* Terminal content */}
        <div className="overflow-x-auto p-4 font-mono text-[13px] leading-6">
          {lines.map((line, i) => (
            <div key={i} className={line.highlight ? "text-green-400" : "text-gray-400"}>
              {line.prompt && <span className="text-cyan-400">$ </span>}
              {line.text}
            </div>
          ))}
          <div className="mt-1 inline-block h-4 w-2 animate-pulse bg-gray-400" />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Real terminal output from the hands-on lab environment
      </p>
    </section>
  );
}
