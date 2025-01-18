import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async action to fetch questions from the API
export const fetchQuestions = createAsyncThunk(
    "quiz/fetchQuestions",
    async (thunkAPI) => {
      const fetchData = async () => {
        try {
          const response = await axios.get("https://opentdb.com/api.php?amount=15");
          return response.data.results.map((q, index) => ({
            id: index + 1,
            question: q.question,
            options: [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5),
            correctAnswer: q.correct_answer,
            userAnswer: null,
          }));
        } catch (error) {
          if (error.response?.status === 429) {
            // If 429, retry after 5 seconds
            return new Promise((resolve) => setTimeout(() => resolve(fetchData()), 5000));
          }
          throw error;
        }
      };
  
      return await fetchData();
    }
  );
  

const quizSlice = createSlice({
    name: "quiz",
    initialState: {
      questions: [],
      currentQuestionIndex: 0,
      isSubmitted: false,
      score: 0,
      loading: false,
      visitedQuestions: [1], // Track visited questions
    },
    reducers: {
    // Inside quizSlice.js
setAnswer: (state, action) => {
    const { questionId, answer } = action.payload;
    const question = state.questions.find((q) => q.id === questionId);
  
    if (question) {
      // Mark as attempted when user selects an answer
      question.userAnswer = answer;
  
      // If the question was not already visited, mark it as visited
      if (!state.visitedQuestions.includes(questionId)) {
        state.visitedQuestions.push(questionId);
      }
    }
  },
  
 // Inside quizSlice.js
goToQuestion: (state, action) => {
    const questionIndex = action.payload;
    const question = state.questions[questionIndex];
    
    // Mark the question as visited when user clicks to go to it
    if (!state.visitedQuestions.includes(question.id)) {
      state.visitedQuestions.push(question.id);
    }
  
    // Update the current question index
    state.currentQuestionIndex = questionIndex;
  },
  
      submitQuiz: (state) => {
        state.isSubmitted = true;
        state.score = state.questions.filter(
          (q) => q.userAnswer === q.correctAnswer
        ).length;
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchQuestions.pending, (state) => {
          state.loading = true;
        })
        .addCase(fetchQuestions.fulfilled, (state, action) => {
          state.loading = false;
          state.questions = action.payload; // Populate questions
        })
        .addCase(fetchQuestions.rejected, (state) => {
          state.loading = false;
          state.questions = [];
        });
    },
  });
  

// Export actions and reducer
export const { setAnswer, goToQuestion, submitQuiz } = quizSlice.actions;
export default quizSlice.reducer;
