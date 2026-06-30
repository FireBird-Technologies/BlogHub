import { useParams } from "react-router-dom";
import RoundupPage from "./RoundupPage";

// Thin route wrapper: renders the shared roundup page in its "underrated" variant.
// The underrated list lives on the same roundup record, so this fetches the same
// data and simply shows the other list.
export default function UnderratedRoundupPage() {
  const { slug } = useParams();
  return <RoundupPage slug={slug} variant="underrated" />;
}
