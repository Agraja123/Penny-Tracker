import { useState, useEffect } from "react";
import Sheet, { Field } from "./Sheet";
import RupeeInput from "./RupeeInput";
import { todayKey } from "../utils/date";

const FREQUENCIES = [
  { key: "monthly", label: "Every month" },
  { key: "weekly", label: "Every week" },
  { key: "yearly", label: "Every year" },
  { key: "once", label: "One time only" },
];

const digits = (v) => v.replace(/[^0-9]/g, "").slice(0, 9);

// Add/edit form for a bill (wifi, electricity, credit card...) or a loan with EMI.
const BillModal = ({ open, kind, initial, onClose, onSave }) => {
  const isLoan = kind === "loan";
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [nextDueDate, setNextDueDate] = useState(todayKey());
  const [remindDaysBefore, setRemindDaysBefore] = useState("2");
  const [lender, setLender] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [remainingAmount, setRemainingAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title || "");
    setAmount(initial?.amount ? String(initial.amount) : "");
    setFrequency(initial?.frequency || "monthly");
    setNextDueDate(initial?.nextDueDate || todayKey());
    setRemindDaysBefore(String(initial?.remindDaysBefore ?? 2));
    setLender(initial?.lender || "");
    setTotalAmount(initial?.totalAmount ? String(initial.totalAmount) : "");
    setRemainingAmount(initial?.remainingAmount !== undefined ? String(initial.remainingAmount) : "");
    setInterestRate(initial?.interestRate ? String(initial.interestRate) : "");
    setError("");
  }, [open, initial]);

  const handleSave = () => {
    if (!title.trim()) return setError(isLoan ? "Give the loan a name (e.g. Bike loan)" : "Give the bill a title (e.g. Wifi bill)");
    if (!parseInt(amount, 10)) return setError(isLoan ? "Enter the EMI amount, whole rupees" : "Enter the bill amount, whole rupees");
    if (!nextDueDate) return setError("Pick the next due date");
    if (isLoan && !parseInt(totalAmount || remainingAmount, 10)) return setError("Enter the loan amount or what is still remaining");

    const payload = {
      kind: isLoan ? "loan" : "bill",
      title: title.trim(),
      amount: parseInt(amount, 10),
      frequency: isLoan && frequency === "once" ? "monthly" : frequency,
      nextDueDate,
      remindDaysBefore: Math.max(0, parseInt(remindDaysBefore, 10) || 0),
    };
    if (isLoan) {
      payload.lender = lender.trim();
      if (totalAmount) payload.totalAmount = parseInt(totalAmount, 10);
      if (remainingAmount !== "") payload.remainingAmount = parseInt(remainingAmount, 10);
      if (interestRate) payload.interestRate = parseFloat(interestRate);
    }
    onSave(payload);
  };

  return (
    <Sheet
      open={open}
      title={`${initial ? "Edit" : "Add"} ${isLoan ? "loan" : "bill"}`}
      subtitle={isLoan ? "Track your EMI and what is left to pay" : "Any bill you pay regularly or once"}
      onClose={onClose}
      onSave={handleSave}
      accent="accent"
      error={error}
    >
      <Field label={isLoan ? "Loan name" : "Bill title"}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          placeholder={isLoan ? "e.g. Bike loan" : "e.g. Wifi bill, Electricity, Credit card"}
          className="input input-bordered w-full bg-base-200"
          autoFocus
        />
      </Field>

      <Field label={isLoan ? "EMI amount" : "Amount"}>
        <RupeeInput value={amount} onChange={setAmount} placeholder={isLoan ? "3500" : "499"} />
      </Field>

      {isLoan && (
        <>
          <Field label="Lender (optional)">
            <input type="text" value={lender} onChange={(e) => setLender(e.target.value)} maxLength={60} placeholder="e.g. HDFC Bank" className="input input-bordered w-full bg-base-200" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total loan">
              <input type="text" inputMode="numeric" value={totalAmount} onChange={(e) => setTotalAmount(digits(e.target.value))} placeholder="60000" className="input input-bordered w-full bg-base-200" />
            </Field>
            <Field label="Remaining">
              <input type="text" inputMode="numeric" value={remainingAmount} onChange={(e) => setRemainingAmount(digits(e.target.value))} placeholder="same as total" className="input input-bordered w-full bg-base-200" />
            </Field>
          </div>
          <Field label="Interest rate % per year (optional)">
            <input type="text" inputMode="decimal" value={interestRate} onChange={(e) => setInterestRate(e.target.value.replace(/[^0-9.]/g, "").slice(0, 5))} placeholder="e.g. 10.5" className="input input-bordered w-full bg-base-200" />
          </Field>
        </>
      )}

      <Field label="Repeats">
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="select select-bordered w-full bg-base-200">
          {FREQUENCIES.filter((f) => !(isLoan && f.key === "once")).map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Next due date">
          <input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} className="input input-bordered w-full bg-base-200" />
        </Field>
        <Field label="Remind me (days before)">
          <input type="text" inputMode="numeric" value={remindDaysBefore} onChange={(e) => setRemindDaysBefore(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))} className="input input-bordered w-full bg-base-200" />
        </Field>
      </div>
    </Sheet>
  );
};

export default BillModal;
