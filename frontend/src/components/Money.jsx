import { inr } from "../utils/format";

// Every rupee amount in the app goes through this component so formatting stays consistent.
const Money = ({ v }) => <span className="amt">{inr(v)}</span>;

export default Money;
