import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchQuestions, setAnswer, goToQuestion, submitQuiz } from "./quizSlice";
import OverviewPanel from "./OverviewPanel";

export const Quiz = () => {
  const dispatch = useDispatch();
  const { questions, currentQuestionIndex, isSubmitted, score, loading } = useSelector((state) => state.quiz);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds

  // Fetch questions when the app mounts
  useEffect(() => {
    dispatch(fetchQuestions()); // Fetch questions from API
  }, [dispatch]);

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      dispatch(submitQuiz()); // Auto-submit when time runs out
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer); // Cleanup timer
  }, [timeLeft, dispatch]);

  // Handle answer selection
  const handleAnswer = (questionId, answer) => {
    dispatch(setAnswer({ questionId, answer }));
  };

  // Handle manual submission
  const handleSubmit = () => {
    dispatch(submitQuiz());
  };

  if (loading) return <div>Loading questions...</div>;

  if (!questions.length) return <div>No questions available!</div>;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="p-6 max-w-7xl mx-auto flex gap-4 flex-col lg:flex-row">
      {/* Overview Panel */}
      <OverviewPanel />

      {/* Quiz Section */}
      <div className="flex-1 w-full lg:w-3/4">
        {!isSubmitted ? (
          <div>
            {/* Timer and Question */}
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-sky-400">CausalFunnel Quiz App</h1>
              <div>Email-{localStorage.getItem('userEmail')}</div>
              <div className="text-red-600">
                Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </div>
            </div>

            {/* Current Question */}
            <div className="mb-6 mt-10">
              <h2 className="text-xl font-semibold">
                Question {currentQuestionIndex + 1}: {currentQuestion.question}
              </h2>
              <div className="space-y-2">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    className={`block w-full p-3 rounded-md transition-colors duration-300 ${
                      currentQuestion.userAnswer === option ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}
                    onClick={() => handleAnswer(currentQuestion.id, option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mb-4">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => dispatch(goToQuestion(currentQuestionIndex - 1))}
                className="px-4 py-2 bg-gray-300 rounded-md w-full sm:w-auto"
              >
                Previous
              </button>
              <button
                disabled={currentQuestionIndex === questions.length - 1}
                onClick={() => dispatch(goToQuestion(currentQuestionIndex + 1))}
                className="px-4 py-2 bg-gray-300 rounded-md w-full sm:w-auto"
              >
                Next
              </button>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md w-full sm:w-auto"
            >
              Submit Quiz
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold">Quiz Submitted!</h2>
            <p className="text-lg">Your Score: {score}/{questions.length}</p>
            <ul className="mt-4 space-y-2">
              {questions.map((q) => (
                <li key={q.id} className="p-2 rounded bg-gray-200">
                  <p><strong>Q:</strong> {q.id} {q.question}</p>
                  <p><strong>Your Answer:</strong> {q.userAnswer || 'Not Answered'}</p>
                  <p><strong>Correct Answer:</strong> {q.correctAnswer}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
