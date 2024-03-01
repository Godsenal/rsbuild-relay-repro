import { graphql } from "react-relay";
import "./App.css";

const Query = graphql`
  query AppQuery {
    getTest {
      test
    }
  }
`;

console.log((Query as any).default.params.text);

function App() {
  return <div className="App">Test</div>;
}

export default App;
