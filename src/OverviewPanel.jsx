import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { goToQuestion } from "./quizSlice";

const OverviewPanel = () => {
  const dispatch = useDispatch();
  const { questions, visitedQuestions } = useSelector((state) => state.quiz);

  const isAttempted = (question) => question.userAnswer !== null;

  return (
    <div className="p-4 bg-gray-800 rounded-lg w-full lg:w-[300px]">
      <h2 className="text-xl font-bold text-yellow-400 mb-4">Overview</h2>
      <ul className="space-y-2">
        {questions.map((question, index) => (
          <li
            key={question.id}
            onClick={() => dispatch(goToQuestion(index))}
            className={`p-2 rounded-lg cursor-pointer ${
              visitedQuestions.includes(question.id)
                ? "bg-blue-500 text-white" // Visited
                : "bg-gray-700 text-gray-300"
            } ${
              isAttempted(question) ? "border-green-500 border-l-4" : "" // Attempted
            }`}
          >
            <span>Q{question.id}</span>
            {isAttempted(question) && (
              <span className="ml-2 text-xs text-green-200">(Attempted)</span>
            )}
            {!isAttempted(question) && visitedQuestions.includes(question.id) && (
              <span className="ml-2 text-xs text-yellow-200">(Visited)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OverviewPanel;
