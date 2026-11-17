import type { HubAnswer, HubQuestion } from "../_lib/hubFlow";
import { QualitativeResponse } from "./QualitativeResponse";
import { QuantitativeResponse } from "./QuantitativeResponse";

interface HubQuestionInputProps {
  question: HubQuestion;
  /** Present once the question was answered — renders it read-only. */
  answer?: HubAnswer;
  onAnswer: (value: number) => void;
}

/** Answer controls rendered below a hub question message. */
export function HubQuestionInput({
  question,
  answer,
  onAnswer,
}: HubQuestionInputProps) {
  const answeredValue = answer ? answer.value : null;

  if (question.inputType === "qualitative") {
    return (
      <div className="mt-4">
        <QualitativeResponse
          onSelect={onAnswer}
          disabled={!!answer}
          selectedValue={answeredValue}
        />
      </div>
    );
  }

  return (
    <div className="mt-2">
      <QuantitativeResponse
        onSubmit={onAnswer}
        disabled={!!answer}
        submittedValue={answeredValue}
      />
    </div>
  );
}
