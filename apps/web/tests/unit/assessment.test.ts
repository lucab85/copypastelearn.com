import { describe, expect, it } from "vitest";
import {
  gradeAssessment,
  parseAssessmentMarkdown,
  toPublicQuestions,
} from "@/lib/assessment";

const MD = `# Demo Course: Final Assessment

*Two questions.*

### 1. What does \`ps\` show?

A) Downloads.  
B) Loaded models.  
C) Disk usage.  
D) Nothing.  

✅ **Correct Answer:** B) Loaded models.

💡 **Explanation:** It lists what is loaded.

❌ **Incorrect Answers:**

- A) That is pull.
- C) That is list.
- D) It prints a table.

**Relevant Video:** L1V1

### 2. Which port?

A) 80  
B) 443  
C) 11434  
D) 22  

✅ **Correct Answer:** C) 11434

💡 **Explanation:** The default port.

❌ **Incorrect Answers:**

- A) HTTP.
- B) HTTPS.
- D) SSH.

**Relevant Video:** L1V3
`;

describe("parseAssessmentMarkdown", () => {
  const { title, questions } = parseAssessmentMarkdown(MD);

  it("reads title, options, answer, explanations and video", () => {
    expect(title).toBe("Demo Course: Final Assessment");
    expect(questions).toHaveLength(2);
    expect(questions[0].prompt).toBe("What does `ps` show?");
    expect(questions[0].options.map((o) => o.key)).toEqual(["A", "B", "C", "D"]);
    expect(questions[0].options[1].text).toBe("Loaded models.");
    expect(questions[0].correct).toBe("B");
    expect(questions[0].explanation).toBe("It lists what is loaded.");
    expect(questions[0].incorrect).toEqual({
      A: "That is pull.",
      C: "That is list.",
      D: "It prints a table.",
    });
    expect(questions[1].relevantVideo).toBe("L1V3");
  });

  it("rejects a question whose correct answer is not an option", () => {
    expect(() =>
      parseAssessmentMarkdown(MD.replace("**Correct Answer:** B)", "**Correct Answer:** E)"))
    ).toThrow(/Question 1/);
  });

  it("rejects a document with no questions", () => {
    expect(() => parseAssessmentMarkdown("# Title only")).toThrow(/No questions/);
  });

  it("never sends answers to the browser", () => {
    const pub = toPublicQuestions(questions);
    expect(Object.keys(pub[0]).sort()).toEqual(["options", "prompt"]);
  });
});

describe("gradeAssessment", () => {
  const { questions } = parseAssessmentMarkdown(MD);

  it("scores and applies the pass mark", () => {
    const all = gradeAssessment(questions, ["B", "C"], 70);
    expect(all).toMatchObject({ score: 2, total: 2, percent: 100, passed: true });
    const half = gradeAssessment(questions, ["B", "A"], 70);
    expect(half).toMatchObject({ score: 1, percent: 50, passed: false });
    expect(half.questions[1]).toMatchObject({ chosen: "A", isCorrect: false });
  });

  it("counts a missing answer as wrong", () => {
    expect(gradeAssessment(questions, ["B"], 50)).toMatchObject({ score: 1, passed: true });
    expect(gradeAssessment(questions, [], 50).questions[0].chosen).toBeNull();
  });
});
