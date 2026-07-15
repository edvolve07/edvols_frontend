import { Plus } from 'lucide-react';
import QuestionEditorCard from './QuestionEditorCard';

export function blankQuestion(defaults = {}) {
  return {
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    explanation: '',
    shortcut: '',
    concept: defaults.concept || '',
    difficulty: defaults.difficulty || 'Medium',
    marks: 1,
    negative_marks: 0.25,
  };
}

export default function QuestionList({ questions, setQuestions, defaults }) {
  function updateQuestion(index, next) {
    setQuestions(questions.map((item, itemIndex) => (itemIndex === index ? next : item)));
  }

  function deleteQuestion(index) {
    setQuestions(questions.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <QuestionEditorCard
          key={question.id || index}
          question={question}
          index={index}
          onChange={updateQuestion}
          onDelete={deleteQuestion}
        />
      ))}
      <button
        type="button"
        onClick={() => setQuestions([...questions, blankQuestion(defaults)])}
        className="btn-dark"
      >
        <Plus className="h-4 w-4" />
        Add question
      </button>
    </div>
  );
}
