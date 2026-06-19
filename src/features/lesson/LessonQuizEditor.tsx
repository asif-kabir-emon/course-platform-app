"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ResponsiveFilterSelect from "@/components/ResponsiveFilterSelect";
import {
  useGetLessonQuizQuery,
  useSaveLessonQuizMutation,
} from "@/hooks/lesson.hook";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  isChoiceQuestion,
  type QuizGradeStrategy,
  type QuizKind,
  type QuizQuestionType,
} from "@/types/quiz";
import QuizGradingPanel from "./QuizGradingPanel";

type QuizQuestion = {
  prompt: string;
  type: QuizQuestionType;
  options: string[];
  correctOption: number;
  correctOptions: number[];
  acceptedAnswers: string[];
  caseSensitive: boolean;
  points: number;
  explanation: string;
};

const createQuestion = (): QuizQuestion => ({
  prompt: "",
  type: "single_choice",
  options: ["", ""],
  correctOption: 0,
  correctOptions: [0],
  acceptedAnswers: [""],
  caseSensitive: false,
  points: 1,
  explanation: "",
});

const LessonQuizEditor = ({ lessonId }: { lessonId: string }) => {
  const { data, isLoading } = useGetLessonQuizQuery(lessonId);
  const [saveQuiz, { isLoading: isSaving }] = useSaveLessonQuizMutation();
  const [title, setTitle] = useState("Lesson knowledge check");
  const [kind, setKind] = useState<QuizKind>("quiz");
  const [gradeStrategy, setGradeStrategy] =
    useState<QuizGradeStrategy>("highest");
  const [passingScore, setPassingScore] = useState(70);
  const [isGradable, setIsGradable] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("");
  const [maxAttempts, setMaxAttempts] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    if (!data?.success || !data.data) return;

    setTitle(data.data.title);
    setKind(data.data.kind || "quiz");
    setGradeStrategy(data.data.gradeStrategy || "highest");
    setPassingScore(data.data.passingScore);
    setIsGradable(data.data.isGradable !== false);
    setIsPublished(data.data.isPublished);
    setTimeLimitMinutes(
      data.data.timeLimitMinutes ? String(data.data.timeLimitMinutes) : "",
    );
    setMaxAttempts(data.data.maxAttempts ? String(data.data.maxAttempts) : "");
    setAvailableFrom(toDateTimeLocal(data.data.availableFrom));
    setAvailableUntil(toDateTimeLocal(data.data.availableUntil));
    setQuestions(
      data.data.questions.map(
        (question: {
          prompt: string;
          type?: QuizQuestionType;
          options: string[];
          correctOption: number;
          correctOptions?: number[];
          acceptedAnswers?: string[];
          caseSensitive?: boolean;
          points?: number;
          explanation?: string;
        }) => ({
          prompt: question.prompt,
          type: question.type || "single_choice",
          options: question.options,
          correctOption: question.correctOption,
          correctOptions: question.correctOptions?.length
            ? question.correctOptions
            : [question.correctOption],
          acceptedAnswers: question.acceptedAnswers?.length
            ? question.acceptedAnswers
            : [""],
          caseSensitive: question.caseSensitive === true,
          points: question.points || 1,
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

  const changeQuestionType = (
    questionIndex: number,
    type: QuizQuestionType,
  ) => {
    const question = questions[questionIndex];
    const options =
      type === "true_false"
        ? ["True", "False"]
        : isChoiceQuestion(type)
          ? question.options.length >= 2
            ? question.options
            : ["", ""]
          : [];

    updateQuestion(questionIndex, {
      type,
      options,
      correctOption: 0,
      correctOptions: isChoiceQuestion(type) ? [0] : [],
      acceptedAnswers: type === "short_answer" ? question.acceptedAnswers : [],
    });
  };

  const toggleCorrectOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    if (question.type !== "multiple_choice") {
      updateQuestion(questionIndex, {
        correctOption: optionIndex,
        correctOptions: [optionIndex],
      });
      return;
    }

    const selected = question.correctOptions.includes(optionIndex)
      ? question.correctOptions.filter((option) => option !== optionIndex)
      : [...question.correctOptions, optionIndex];
    updateQuestion(questionIndex, {
      correctOption: selected[0] ?? 0,
      correctOptions: selected,
    });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    if (question.options.length <= 2) return;

    const options = question.options.filter(
      (_, index) => index !== optionIndex,
    );
    const correctOptions = question.correctOptions
      .filter((option) => option !== optionIndex)
      .map((option) => (option > optionIndex ? option - 1 : option));
    updateQuestion(questionIndex, {
      options,
      correctOption: correctOptions[0] ?? 0,
      correctOptions,
    });
  };

  const handleSave = async () => {
    try {
      const response = await saveQuiz({
        lessonId,
        body: {
          title,
          kind,
          gradeStrategy,
          passingScore,
          isGradable,
          isPublished,
          timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
          maxAttempts: maxAttempts ? Number(maxAttempts) : null,
          availableFrom: availableFrom
            ? new Date(availableFrom).toISOString()
            : null,
          availableUntil: availableUntil
            ? new Date(availableUntil).toISOString()
            : null,
          questions,
        },
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
            <h2 className="text-xl font-semibold">Quiz and exam settings</h2>
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
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Assessment type</Label>
            <ResponsiveFilterSelect
              value={kind}
              onValueChange={(value) => setKind(value as QuizKind)}
              label="Assessment type"
              options={[
                {
                  label: "Quiz",
                  value: "quiz",
                  description: "A lighter knowledge check.",
                },
                {
                  label: "Exam",
                  value: "exam",
                  description: "A formal timed assessment.",
                },
              ]}
              mobilePresentation="popover"
              className="h-10"
            />
          </div>
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
            <Label>Grading</Label>
            <ResponsiveFilterSelect
              value={isGradable ? "graded" : "completion"}
              onValueChange={(value) => setIsGradable(value === "graded")}
              label="Grading mode"
              options={[
                {
                  label: "Graded",
                  value: "graded",
                  description: "Calculate a score and passing result.",
                },
                {
                  label: "Completion only",
                  value: "completion",
                  description: "Record submission without a score.",
                },
              ]}
              mobilePresentation="popover"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label>Final grade uses</Label>
            <ResponsiveFilterSelect
              value={gradeStrategy}
              onValueChange={(value) =>
                setGradeStrategy(value as QuizGradeStrategy)
              }
              label="Final grade calculation"
              options={[
                {
                  label: "Highest attempt",
                  value: "highest",
                  description: "Keep the learner's best valid score.",
                },
                {
                  label: "Latest attempt",
                  value: "latest",
                  description: "Use the most recently graded attempt.",
                },
                {
                  label: "Average attempts",
                  value: "average",
                  description: "Average all valid graded attempts.",
                },
                {
                  label: "First attempt",
                  value: "first",
                  description: "Use the first valid graded attempt.",
                },
              ]}
              mobilePresentation="popover"
              className="h-10"
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
          <div className="space-y-2">
            <Label htmlFor="time-limit">Time limit (minutes)</Label>
            <Input
              id="time-limit"
              type="number"
              min={1}
              value={timeLimitMinutes}
              onChange={(event) => setTimeLimitMinutes(event.target.value)}
              placeholder="No limit"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-attempts">Maximum attempts</Label>
            <Input
              id="max-attempts"
              type="number"
              min={1}
              value={maxAttempts}
              onChange={(event) => setMaxAttempts(event.target.value)}
              placeholder="Unlimited"
            />
          </div>
          <div className="space-y-2 md:col-span-1 xl:col-span-2">
            <Label htmlFor="available-from">Attempt window starts</Label>
            <Input
              id="available-from"
              type="datetime-local"
              value={availableFrom}
              onChange={(event) => setAvailableFrom(event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-1 xl:col-span-2">
            <Label htmlFor="available-until">Attempt window ends</Label>
            <Input
              id="available-until"
              type="datetime-local"
              value={availableUntil}
              onChange={(event) => setAvailableUntil(event.target.value)}
            />
          </div>
        </div>
      </section>

      {questions.map((question, questionIndex) => (
        <section key={questionIndex} className="surface-panel overflow-hidden">
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
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
              <div className="space-y-2">
                <Label>Question type</Label>
                <ResponsiveFilterSelect
                  value={question.type}
                  onValueChange={(value) =>
                    changeQuestionType(questionIndex, value as QuizQuestionType)
                  }
                  label={`Question ${questionIndex + 1} type`}
                  options={questionTypeOptions}
                  mobilePresentation="popover"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  min={1}
                  value={question.points}
                  onChange={(event) =>
                    updateQuestion(questionIndex, {
                      points: Number(event.target.value),
                    })
                  }
                />
              </div>
            </div>
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
            {isChoiceQuestion(question.type) && (
              <div className="space-y-3">
                <Label>Answer options</Label>
                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
                  >
                    <input
                      type={
                        question.type === "multiple_choice"
                          ? "checkbox"
                          : "radio"
                      }
                      name={`correct-answer-${questionIndex}`}
                      checked={question.correctOptions.includes(optionIndex)}
                      onChange={() =>
                        toggleCorrectOption(questionIndex, optionIndex)
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
                  disabled={question.type === "true_false"}
                >
                  <Plus className="size-4" />
                  Add option
                </Button>
              </div>
            )}
            {question.type === "short_answer" && (
              <div className="space-y-3">
                <Label>Accepted answers</Label>
                {question.acceptedAnswers.map((answer, answerIndex) => (
                  <div
                    key={answerIndex}
                    className="grid grid-cols-[1fr_auto] gap-2"
                  >
                    <Input
                      value={answer}
                      onChange={(event) => {
                        const acceptedAnswers = [...question.acceptedAnswers];
                        acceptedAnswers[answerIndex] = event.target.value;
                        updateQuestion(questionIndex, { acceptedAnswers });
                      }}
                      placeholder={`Accepted answer ${answerIndex + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={question.acceptedAnswers.length <= 1}
                      onClick={() =>
                        updateQuestion(questionIndex, {
                          acceptedAnswers: question.acceptedAnswers.filter(
                            (_, index) => index !== answerIndex,
                          ),
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateQuestion(questionIndex, {
                        acceptedAnswers: [...question.acceptedAnswers, ""],
                      })
                    }
                  >
                    <Plus className="size-4" />
                    Add accepted answer
                  </Button>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={question.caseSensitive}
                      onChange={(event) =>
                        updateQuestion(questionIndex, {
                          caseSensitive: event.target.checked,
                        })
                      }
                      className="size-4 accent-primary"
                    />
                    Case sensitive
                  </label>
                </div>
              </div>
            )}
            {question.type === "long_answer" && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-900">
                Long answers are saved for manual grading. They do not receive
                automatic points.
              </div>
            )}
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
          onClick={() =>
            setQuestions((current) => [...current, createQuestion()])
          }
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
      <QuizGradingPanel lessonId={lessonId} />
    </div>
  );
};

export default LessonQuizEditor;

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const questionTypeOptions = [
  {
    label: "Single choice",
    value: "single_choice",
    description: "One correct option.",
  },
  {
    label: "Multiple selections",
    value: "multiple_choice",
    description: "More than one correct option.",
  },
  {
    label: "True or false",
    value: "true_false",
    description: "A two-option statement.",
  },
  {
    label: "Short answer",
    value: "short_answer",
    description: "Automatically match accepted text.",
  },
  {
    label: "Long answer",
    value: "long_answer",
    description: "Saved for manual grading.",
  },
];
