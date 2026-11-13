-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "contentUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "labGuide" TEXT,
ADD COLUMN     "trailerPlaybackId" TEXT;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "moduleNumber" INTEGER,
ADD COLUMN     "moduleTitle" TEXT;

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "passPercent" INTEGER NOT NULL DEFAULT 70,
    "questions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CourseCompanions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_courseId_key" ON "Assessment"("courseId");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_userId_assessmentId_idx" ON "AssessmentAttempt"("userId", "assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "_CourseCompanions_AB_unique" ON "_CourseCompanions"("A", "B");

-- CreateIndex
CREATE INDEX "_CourseCompanions_B_index" ON "_CourseCompanions"("B");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseCompanions" ADD CONSTRAINT "_CourseCompanions_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseCompanions" ADD CONSTRAINT "_CourseCompanions_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
