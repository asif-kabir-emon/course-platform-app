"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetLessonQuizQuery,
  useSaveLessonQuizMutation,
} from "@/redux/api/lessonApi";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type QuizQuestion = {
  prompt: string;
  options: string[];
  correctOption: number;
  explanation: string;
};

const createQuestion = (): QuizQuestion => ({
  prompt: "",
  options: ["", ""],
  correctOption: 0,
  explanation: "",
});

const LessonQuizEditor = ({ lessonId }: { lessonId: string }) => {
  const { data, isLoading } = useGetLessonQuizQuery(lessonId);
  const [saveQuiz, { isLoading: isSaving }] = useSaveLessonQuizMutation();
  const [title, setTitle] = useState("Lesson knowledge check");
  const [passingScore, setPassingScore] = useState(70);
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    if (!data?.success || !data.data) return;

    setTitle(data.data.title);
    setPassingScore(data.data.passingScore);
    setIsPublished(data.data.isPublished);
    setQuestions(
      data.data.questions.map(
        (question: {
          prompt: string;
          options: string[];
          correctOption: number;
          explanation?: string;
        }) => ({
          prompt: question.prompt,
          options: question.options,
          correctOption: question.correctOption,
          explanation: question.explanation || "",
        }),
      ),
    );
  }, [data]);

  const updateQuestion = (
    questionIndex: number,
    changes: Partial<QuizQuestion>,
  ) => {
    setQuestions((current) =>
      current.map((question, index) =>
        index === questionIndex ? { ...question, ...changes } : question,
      ),
    );
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) => {
    const options = [...questions[questionIndex].options];
    options[optionIndex] = value;
    updateQuestion(questionIndex, { options });
  };

  const addOption = (questionIndex: number) => {
    updateQuestion(questionIndex, {
      options: [...questions[questionIndex].options, ""],
    });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    if (question.options.length <= 2) return;

    const options = question.options.filter((_, index) => index !== optionIndex);
    let correctOption = question.correctOption;
    if (correctOption === optionIndex) correctOption = 0;
    if (correctOption > optionIndex) correctOption -= 1;
    updateQuestion(questionIndex, { options, correctOption });
  };

  const handleSave = async () => {
    try {
      const response = await saveQuiz({
        lessonId,
        body: { title, passingScore, isPublished, questions },
      }).unwrap();

      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error("Failed to save the lesson quiz.");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto h-72 max-w-5xl animate-pulse rounded-2xl bg-muted" />
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <section className="surface-panel p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Lesson quiz</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Add an optional knowledge check. Draft quizzes stay hidden from
              learners until published.
            </p>
          </div>
          <label className="flex items-center gap-3 rounded-full border bg-muted/30 px-4 py-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(event) => setIsPublished(event.target.checked)}
              className="size-4 accent-primary"
            />
            Published
          </label>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_12rem]">
          <div className="space-y-2">
            <Label htmlFor="quiz-title">Quiz title</Label>
            <Input
              id="quiz-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Lesson knowledge check"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passing-score">Passing score (%)</Label>
            <Input
              id="passing-score"
              type="number"
              min={1}
              max={100}
              value={passingScore}
              onChange={(event) => setPassingScore(Number(event.target.value))}
            />
          </div>
        </div>
      </section>

      {questions.map((question, questionIndex) => (
        <section
          key={questionIndex}
          className="surface-panel overflow-hidden"
        >
          <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-5 py-4 sm:px-6">
            <h3 className="font-semibold">Question {questionIndex + 1}</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove question ${questionIndex + 1}`}
              onClick={() =>
                setQuestions((current) =>
                  current.filter((_, index) => index !== questionIndex),
                )
              }
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea
                value={question.prompt}
                onChange={(event) =>
                  updateQuestion(questionIndex, {
                    prompt: event.target.value,
                  })
                }
                placeholder="What should the learner understand?"
                className="min-h-24"
              />
            </div>
            <div className="space-y-3">
              <Label>Answer options</Label>
              {question.options.map((option, optionIndex) => (
                <div
                  key={optionIndex}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
                >
                  <input
                    type="radio"
                    name={`correct-answer-${questionIndex}`}
                    checked={question.correctOption === optionIndex}
                    onChange={() =>
                      updateQuestion(questionIndex, {
                        correctOption: optionIndex,
                      })
                    }
                    aria-label={`Mark option ${optionIndex + 1} as correct`}
                    className="size-4 accent-primary"
                  />
                  <Input
                    value={option}
                    onChange={(event) =>
                      updateOption(
                        questionIndex,
                        optionIndex,
                        event.target.value,
                      )
                    }
                    placeholder={`Option ${optionIndex + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={question.options.length <= 2}
                    aria-label={`Remove option ${optionIndex + 1}`}
                    onClick={() => removeOption(questionIndex, optionIndex)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addOption(questionIndex)}
              >
                <Plus className="size-4" />
                Add option
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Answer explanation (optional)</Label>
              <Textarea
                value={question.explanation}
                onChange={(event) =>
                  updateQuestion(questionIndex, {
                    explanation: event.target.value,
                  })
                }
                placeholder="Explain why the selected answer is correct."
              />
            </div>
          </div>
        </section>
      ))}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setQuestions((current) => [...current, createQuestion()])}
        >
          <Plus className="size-4" />
          Add question
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="sm:min-w-36"
        >
          <CheckCircle2 className="size-4" />
          {isSaving ? "Saving..." : "Save quiz"}
        </Button>
      </div>
    </div>
  );
};

export default LessonQuizEditor;
