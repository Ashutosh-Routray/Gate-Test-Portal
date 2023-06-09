import "./style.css";
import { db, auth, storage } from "../../../firebaseConfig";
import {
  collection,
  query,
  getDocs,
  updateDoc,
  doc,
  where,
  Timestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { deleteObject, ref, uploadBytes } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import toast, { Toaster } from "react-hot-toast";
import Collapsible from "../Collapsible/page";

export default function QuestionEditor() {
  const [questions, setQuestions] = useState(null);
  const [testid, setTestId] = useState(null);
  const [online, setOnline] = useState(false);
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(true);
  const [testStartTimestamp, setTestStartTimestamp] = useState(null); // [timestamp, setTimestamp
  const [testDuration, setTestDuration] = useState(null); // [timestamp, setTimestamp
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "test"));
    getDocs(q).then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        setOnline(doc.data().online);
        setTestId(doc.id);
        const map = new Map(Object.entries(doc.data().questions));
        let quests = [];
        map.forEach(function (value, key) {
          if (!value.questionImageUrl || value.questionImageUrl === "")
            value.questionImageUrl = "";
          if (!value.optionImageA || value.optionImageA === "")
            value.optionImageA = "";
          if (!value.optionImageB || value.optionImageB === "")
            value.optionImageB = "";
          if (!value.optionImageC || value.optionImageC === "")
            value.optionImageC = "";
          if (!value.optionImageD || value.optionImageD === "")
            value.optionImageD = "";
          if (!value.explanation || value.explanation === "")
            value.explanation = "";
          if (!value.explanationImageUrl || value.explanationImageUrl === "")
            value.explanationImageUrl = "";
          quests.push(value);
        });
        setQuestions(quests);
        //https://firebasestorage.googleapis.com/v0/b/rlc-gate-test-portal.appspot.com/o/q1?alt=media
        setTestStartTimestamp(doc.data().startTime.toDate());
        setTestDuration(doc.data().duration);
      });
    });
    if (user) {
      const q1 = query(
        collection(db, "admin"),
        where("email", "==", user.email)
      );
      getDocs(q1).then((querySnapshot) => {
        if (querySnapshot.empty) {
          setIsAdmin(false);
        } else {
          setIsAdmin(true);
        }
      });
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window?.MathJax !== "undefined") {
        window.MathJax.typeset();
      }
    } catch (err) {
      // console.log(err);
    }
  });

  function removeQuestion(index) {
    let quests = [...questions];
    quests.splice(index, 1);
    setQuestions(quests);
  }

  function changeStatus() {
    let tempStatus = !online;
    updateDoc(doc(db, "test", testid), { online: !online }).then(() => {
      if (tempStatus) {
        toast("Test is Online", {
          icon: "🟢",
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      } else {
        toast("Test is Offline", {
          icon: "🔴",
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      }
    });
    setOnline(!online);
  }

  function addQuestion() {
    let quests = [...questions];
    quests.push({
      q: "",
      o1: "",
      o2: "",
      o3: "",
      o4: "",
      a: "",
      questionType: "somcq",
      marksOnCorrect: "",
      marksOnIncorrect: "",
      questionImageUrl: "",
      optionImageA: "",
      optionImageB: "",
      optionImageC: "",
      optionImageD: "",
      explanation: "",
      explanationImageUrl: "",
    });
    setQuestions(quests);
  }

  function ISOtoLocal(time) {
    const z = new Date().getTimezoneOffset() * 60 * 1000;
    time = time - z;
    time = new Date(time).toISOString();
    time = time.split(".")[0];
    return time;
  }

  function uploadTest() {
    // Convert questions array to map
    let newQuestions = {};
    // console.log(questions);
    for (let i = 0; i < questions.length; i++) {
      let q = questions[i].q;
      let o1 = questions[i].o1;
      let o2 = questions[i].o2;
      let o3 = questions[i].o3;
      let o4 = questions[i].o4;
      let a = questions[i].a;
      let questionType = questions[i].questionType;
      let marksOnCorrect = questions[i].marksOnCorrect;
      let marksOnIncorrect = questions[i].marksOnIncorrect;
      let questionImageUrl = questions[i].questionImageUrl;
      let optionImageA = questions[i].optionImageA;
      let optionImageB = questions[i].optionImageB;
      let optionImageC = questions[i].optionImageC;
      let optionImageD = questions[i].optionImageD;
      let explanation = questions[i].explanation;
      let explanationImageUrl = questions[i].explanationImageUrl;
      newQuestions[i + 1] = {
        q: q,
        o1: o1,
        o2: o2,
        o3: o3,
        o4: o4,
        a: a,
        questionType: questionType,
        marksOnCorrect: marksOnCorrect,
        marksOnIncorrect: marksOnIncorrect,
        questionImageUrl: questionImageUrl,
        optionImageA: optionImageA,
        optionImageB: optionImageB,
        optionImageC: optionImageC,
        optionImageD: optionImageD,
        explanation: explanation,
        explanationImageUrl: explanationImageUrl,
      };
    }
    let test = {
      questions: newQuestions,
      startTime: Timestamp.fromDate(new Date(testStartTimestamp)),
      duration: testDuration,
    };
    updateDoc(doc(db, "test", testid), test)
      .then(() => {
        toast("Test Uploaded", {
          icon: "✅",
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      })
      .catch((error) => {
        toast("Cannot Upload", {
          icon: "❌",
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        });
      });
  }

  function clearTest() {
    // console.log(questions.length);
    setQuestions([]);
    toast("Test Cleared", {
      icon: "✅",
      style: {
        borderRadius: "10px",
        background: "#333",
        color: "#fff",
      },
    });
  }

  function logout(e) {
    e.preventDefault();
    signOut(auth)
      .then(() => {
        console.log("Signed out successfully!");
        navigate("/admin");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
      });
  }

  function updateStudentDB() {
    const q = query(collection(db, "students"));
    let answer = {};
    for (let i = 0; i < questions.length; i++) {
      answer[i + 1] = {
        answer: "",
        status: i === 0 ? "na" : "nv",
      };
    }
    getDocs(q).then((querySnapshot) => {
      querySnapshot.forEach((student) => {
        updateDoc(doc(db, "students", student.id), {
          attended: false,
          answers: answer,
        });
      });
      toast("Updated Student Database", {
        icon: "✅",
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
    });
  }

  return (
    <>
      {user ? (
        isAdmin ? (
          testStartTimestamp && testDuration ? (
            <>
              <div className="questions">
                {questions !== null
                  ? questions.map((question, index) => {
                      return (
                        <Collapsible key={`Collapsible${index}`} index={index}>
                          <div
                            className={"editableQuestion q" + (index + 1)}
                            id={"questionTab" + (index + 1)}
                            key={index + 1}
                          >
                            <div className="q">
                              <label htmlFor="question">Question</label>
                              <textarea
                                type="text"
                                name="question"
                                id="question"
                                // defaultValue={question.q}
                                value={question.q}
                                placeholder="Enter text for question"
                                onChange={(e) => {
                                  let quests = [...questions];
                                  quests[index].q = e.target.value;
                                  setQuestions(quests);
                                }}
                              />
                            </div>
                            <div className="o1">
                              <label htmlFor="option1">Option 1</label>
                              <div className="mainDivOption">
                                <div className="optionText">
                                  <input
                                    type="text"
                                    name="option1"
                                    id="option1"
                                    defaultValue={question.o1}
                                    placeholder="Enter text for option 1"
                                    onChange={(e) => {
                                      let quests = [...questions];
                                      quests[index].o1 = e.target.value;
                                      setQuestions(quests);
                                    }}
                                  />
                                </div>
                                <div className="optionImage">
                                  <img
                                    id={`optionImageA${index + 1}`}
                                    src={questions[index].optionImageA}
                                    alt="optionImageA"
                                    style={{
                                      display:
                                        questions[index].optionImageA !== ""
                                          ? "block"
                                          : "none",
                                    }}
                                  />
                                  <p
                                    id={`optionImageTextA${index + 1}`}
                                    style={{
                                      display:
                                        questions[index].optionImageA === ""
                                          ? "block"
                                          : "none",
                                    }}
                                  >
                                    No image for this option
                                  </p>
                                  <div className="imageConsole">
                                    <input
                                      type="file"
                                      name="questionImageUpload"
                                      className="imageUploadInput"
                                      id={`optionImageUploadA${index + 1}`}
                                      onChange={(e) => {
                                        const name = `q${index + 1}A`;
                                        const REF = ref(storage, name);
                                        const file = e.target.files[0];
                                        const metadata = {
                                          contentType: file.type,
                                        };
                                        uploadBytes(REF, file, metadata)
                                          .then((snapshot) => {
                                            let temp = questions;
                                            temp[
                                              index
                                            ].optionImageA = `https://firebasestorage.googleapis.com/v0/b/rlc-gate-test-portal.appspot.com/o/q${
                                              index + 1
                                            }A?alt=media`;
                                            setQuestions(temp);
                                            document.getElementById(
                                              `optionImageA${index + 1}`
                                            ).src = URL.createObjectURL(
                                              e.target.files[0]
                                            );
                                            document.getElementById(
                                              `optionImageA${index + 1}`
                                            ).style.display = "block";
                                            document.getElementById(
                                              `optionImageTextA${index + 1}`
                                            ).style.display = "none";
                                            document.getElementById(
                                              `removeImageBtnA${index + 1}`
                                            ).style.display = "block";
                                            console.log(
                                              `Image for ${name} uploaded`
                                            );
                                          })
                                          .catch(console.error);
                                        // console.log(e.target.files[0]);
                                      }}
                                    />
                                    <button
                                      onClick={(e) => {
                                        let temp = questions;
                                        temp[index].optionImageA = "";
                                        setQuestions(temp);
                                        document.getElementById(
                                          `optionImageA${index + 1}`
                                        ).style.display = "none";
                                        document.getElementById(
                                          `optionImageTextA${index + 1}`
                                        ).style.display = "block";
                                        e.target.style.display = "none";
                                        document.getElementById(
                                          `optionImageUploadA${index + 1}`
                                        ).value = "";
                                        // Remove from database
                                        const name = `q${index + 1}A`;
                                        const REF = ref(storage, name);
                                        deleteObject(REF)
                                          .then(() => {
                                            console.log(
                                              `Image for ${name} deleted`
                                            );
                                          })
                                          .catch((error) => {
                                            console.log(error);
                                          });
                                      }}
                                      className="removeImageBtn"
                                      id={`removeImageBtnA${index + 1}`}
                                      style={{
                                        display:
                                          questions[index].optionImageA !== ""
                                            ? "block"
                                            : "none",
                                      }}
                                    >
                                      Remove Image
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="o2">
                              <label htmlFor="option2">Option 2</label>
                              <div className="mainDivOption">
                                <div className="optionText">
                                  <input
                                    type="text"
                                    name="option2"
                                    id="option2"
                                    placeholder="Enter text for option 2"
                                    defaultValue={question.o2}
                                    onChange={(e) => {
                                      let quests = [...questions];
                                      quests[index].o2 = e.target.value;
                                      setQuestions(quests);
                                    }}
                                  />
                                </div>
                                <div className="optionImage">
                                  <img
                                    id={`optionImageB${index + 1}`}
                                    src={questions[index].optionImageB}
                                    alt="optionImageB"
                                    style={{
                                      display:
                                        questions[index].optionImageB !== ""
                                          ? "block"
                                          : "none",
                                    }}
                                  />
                                  <p
                                    id={`optionImageTextB${index + 1}`}
                                    style={{
                                      display:
                                        questions[index].optionImageB === ""
                                          ? "block"
                                          : "none",
                                    }}
                                  >
                                    No image for this option
                                  </p>
                                  <div className="imageConsole">
                                    <input
                                      type="file"
                                      name="questionImageUpload"
                                      className="imageUploadInput"
                                      id={`optionImageUploadB${index + 1}`}
                                      onChange={(e) => {
                                        const name = `q${index + 1}B`;
                                        const REF = ref(storage, name);
                                        const file = e.target.files[0];
                                        const metadata = {
                                          contentType: file.type,
                                        };
                                        uploadBytes(REF, file, metadata)
                                          .then((snapshot) => {
                                            let temp = questions;
                                            temp[
                                              index
                                            ].optionImageB = `https://firebasestorage.googleapis.com/v0/b/rlc-gate-test-portal.appspot.com/o/q${
                                              index + 1
                                            }B?alt=media`;
                                            setQuestions(temp);
                                            document.getElementById(
                                              `optionImageB${index + 1}`
                                            ).src = URL.createObjectURL(
                                              e.target.files[0]
                                            );
                                            document.getElementById(
                                              `optionImageB${index + 1}`
                                            ).style.display = "block";
                                            document.getElementById(
                                              `optionImageTextB${index + 1}`
                                            ).style.display = "none";
                                            document.getElementById(
                                              `removeImageBtnB${index + 1}`
                                            ).style.display = "block";
                                            console.log(
                                              `Image for ${name} uploaded`
                                            );
                                          })
                                          .catch(console.error);
                                        // console.log(e.target.files[0]);
                                      }}
                                    />
                                    <button
                                      onClick={(e) => {
                                        let temp = questions;
                                        temp[index].optionImageB = "";
                                        setQuestions(temp);
                                        document.getElementById(
                                          `optionImageB${index + 1}`
                                        ).style.display = "none";
                                        document.getElementById(
                                          `optionImageTextB${index + 1}`
                                        ).style.display = "block";
                                        e.target.style.display = "none";
                                        document.getElementById(
                                          `optionImageUploadB${index + 1}`
                                        ).value = "";
                                        // Remove from database
                                        const name = `q${index + 1}B`;
                                        const REF = ref(storage, name);
                                        deleteObject(REF)
                                          .then(() => {
                                            console.log(
                                              `Image for ${name} deleted`
                                            );
                                          })
                                          .catch((error) => {
                                            console.log(error);
                                          });
                                      }}
                                      className="removeImageBtn"
                                      id={`removeImageBtnB${index + 1}`}
                                      style={{
                                        display:
                                          questions[index].optionImageB !== ""
                                            ? "block"
                                            : "none",
                                      }}
                                    >
                                      Remove Image
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="o3">
                              <label htmlFor="option3">Option 3</label>
                              <div className="mainDivOption">
                                <div className="optionText">
                                  <input
                                    type="text"
                                    name="option3"
                                    placeholder="Enter text for option 3"
                                    id="option3"
                                    defaultValue={question.o3}
                                    onChange={(e) => {
                                      let quests = [...questions];
                                      quests[index].o3 = e.target.value;
                                      setQuestions(quests);
                                    }}
                                  />
                                </div>
                                <div className="optionImage">
                                  <img
                                    id={`optionImageC${index + 1}`}
                                    src={questions[index].optionImageC}
                                    alt="optionImageC"
                                    style={{
                                      display:
                                        questions[index].optionImageC !== ""
                                          ? "block"
                                          : "none",
                                    }}
                                  />
                                  <p
                                    id={`optionImageTextC${index + 1}`}
                                    style={{
                                      display:
                                        questions[index].optionImageC === ""
                                          ? "block"
                                          : "none",
                                    }}
                                  >
                                    No image for this option
                                  </p>
                                  <div className="imageConsole">
                                    <input
                                      type="file"
                                      name="questionImageUpload"
                                      className="imageUploadInput"
                                      id={`optionImageUploadC${index + 1}`}
                                      onChange={(e) => {
                                        const name = `q${index + 1}C`;
                                        const REF = ref(storage, name);
                                        const file = e.target.files[0];
                                        const metadata = {
                                          contentType: file.type,
                                        };
                                        uploadBytes(REF, file, metadata)
                                          .then((snapshot) => {
                                            let temp = questions;
                                            temp[
                                              index
                                            ].optionImageC = `https://firebasestorage.googleapis.com/v0/b/rlc-gate-test-portal.appspot.com/o/q${
                                              index + 1
                                            }C?alt=media`;
                                            setQuestions(temp);
                                            document.getElementById(
                                              `optionImageC${index + 1}`
                                            ).src = URL.createObjectURL(
                                              e.target.files[0]
                                            );
                                            document.getElementById(
                                              `optionImageC${index + 1}`
                                            ).style.display = "block";
                                            document.getElementById(
                                              `optionImageTextC${index + 1}`
                                            ).style.display = "none";
                                            document.getElementById(
                                              `removeImageBtnC${index + 1}`
                                            ).style.display = "block";
                                            console.log(
                                              `Image for ${name} uploaded`
                                            );
                                          })
                                          .catch(console.error);
                                        // console.log(e.target.files[0]);
                                      }}
                                    />
                                    <button
                                      onClick={(e) => {
                                        let temp = questions;
                                        temp[index].optionImageC = "";
                                        setQuestions(temp);
                                        document.getElementById(
                                          `optionImageC${index + 1}`
                                        ).style.display = "none";
                                        document.getElementById(
                                          `optionImageTextC${index + 1}`
                                        ).style.display = "block";
                                        e.target.style.display = "none";
                                        document.getElementById(
                                          `optionImageUploadC${index + 1}`
                                        ).value = "";
                                        // Remove from database
                                        const name = `q${index + 1}C`;
                                        const REF = ref(storage, name);
                                        deleteObject(REF)
                                          .then(() => {
                                            console.log(
                                              `Image for ${name} deleted`
                                            );
                                          })
                                          .catch((error) => {
                                            console.log(error);
                                          });
                                      }}
                                      className="removeImageBtn"
                                      id={`removeImageBtnC${index + 1}`}
                                      style={{
                                        display:
                                          questions[index].optionImageC !== ""
                                            ? "block"
                                            : "none",
                                      }}
                                    >
                                      Remove Image
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="o4">
                              <label htmlFor="option4">Option 4</label>
                              <div className="mainDivOption">
                                <div className="optionText">
                                  <input
                                    type="text"
                                    name="option4"
                                    id="option4"
                                    placeholder="Enter text for option 4"
                                    defaultValue={question.o4}
                                    onChange={(e) => {
                                      let quests = [...questions];
                                      quests[index].o4 = e.target.value;
                                      setQuestions(quests);
                                    }}
                                  />
                                </div>
                                <div className="optionImage">
                                  <img
                                    id={`optionImageD${index + 1}`}
                                    src={questions[index].optionImageD}
                                    alt="optionImageD"
                                    style={{
                                      display:
                                        questions[index].optionImageD !== ""
                                          ? "block"
                                          : "none",
                                    }}
                                  />
                                  <p
                                    id={`optionImageTextD${index + 1}`}
                                    style={{
                                      display:
                                        questions[index].optionImageD === ""
                                          ? "block"
                                          : "none",
                                    }}
                                  >
                                    No image for this option
                                  </p>
                                  <div className="imageConsole">
                                    <input
                                      type="file"
                                      name="questionImageUpload"
                                      className="imageUploadInput"
                                      id={`optionImageUploadD${index + 1}`}
                                      onChange={(e) => {
                                        const name = `q${index + 1}D`;
                                        const REF = ref(storage, name);
                                        const file = e.target.files[0];
                                        const metadata = {
                                          contentType: file.type,
                                        };
                                        uploadBytes(REF, file, metadata)
                                          .then((snapshot) => {
                                            let temp = questions;
                                            temp[
                                              index
                                            ].optionImageD = `https://firebasestorage.googleapis.com/v0/b/rlc-gate-test-portal.appspot.com/o/q${
                                              index + 1
                                            }D?alt=media`;
                                            setQuestions(temp);
                                            document.getElementById(
                                              `optionImageD${index + 1}`
                                            ).src = URL.createObjectURL(
                                              e.target.files[0]
                                            );
                                            document.getElementById(
                                              `optionImageD${index + 1}`
                                            ).style.display = "block";
                                            document.getElementById(
                                              `optionImageTextD${index + 1}`
                                            ).style.display = "none";
                                            document.getElementById(
                                              `removeImageBtnD${index + 1}`
                                            ).style.display = "block";
                                            console.log(
                                              `Image for ${name} uploaded`
                                            );
                                          })
                                          .catch(console.error);
                                        // console.log(e.target.files[0]);
                                      }}
                                    />
                                    <button
                                      onClick={(e) => {
                                        let temp = questions;
                                        temp[index].optionImageD = "";
                                        setQuestions(temp);
                                        document.getElementById(
                                          `optionImageD${index + 1}`
                                        ).style.display = "none";
                                        document.getElementById(
                                          `optionImageTextD${index + 1}`
                                        ).style.display = "block";
                                        e.target.style.display = "none";
                                        document.getElementById(
                                          `optionImageUploadD${index + 1}`
                                        ).value = "";
                                        // Remove from database
                                        const name = `q${index + 1}D`;
                                        const REF = ref(storage, name);
                                        deleteObject(REF)
                                          .then(() => {
                                            console.log(
                                              `Image for ${name} deleted`
                                            );
                                          })
                                          .catch((error) => {
                                            console.log(error);
                                          });
                                      }}
                                      className="removeImageBtn"
                                      id={`removeImageBtnD${index + 1}`}
                                      style={{
                                        display:
                                          questions[index].optionImageD !== ""
                                            ? "block"
                                            : "none",
                                      }}
                                    >
                                      Remove Image
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="answer">
                              <label htmlFor="answer">Answer</label>
                              <input
                                type="text"
                                name="answer"
                                id="answer"
                                // defaultValue={question.a}
                                placeholder="Enter answer for question"
                                value={question.a}
                                onChange={(e) => {
                                  let quests = [...questions];
                                  quests[index].a = e.target.value;
                                  setQuestions(quests);
                                }}
                              />
                            </div>
                            <div className="questionSolutionExplanation">
                              <label htmlFor="questionSolutionExplanation">
                                Explanation
                              </label>
                              <div className="mainDivOption">
                                <div className="optionText">
                                  <textarea
                                    type="text"
                                    name="questionSolutionExplanation"
                                    id="questionSolutionExplanation"
                                    placeholder="Enter explanation for question"
                                    value={question.explanation}
                                    onChange={(e) => {
                                      let quests = [...questions];
                                      quests[index].explanation =
                                        e.target.value;
                                      setQuestions(quests);
                                    }}
                                  />
                                </div>
                                <div className="optionImage">
                                  <img
                                    id={`explanationImage${index + 1}`}
                                    src={questions[index].explanationImageUrl}
                                    alt="explanationImage"
                                    style={{
                                      display:
                                        questions[index].explanationImageUrl !==
                                        ""
                                          ? "block"
                                          : "none",
                                    }}
                                  />
                                  <p
                                    id={`explanationImageText${index + 1}`}
                                    style={{
                                      display:
                                        questions[index].explanationImageUrl ===
                                        ""
                                          ? "block"
                                          : "none",
                                    }}
                                  >
                                    No image for this option
                                  </p>
                                  <div className="imageConsole">
                                    <input
                                      type="file"
                                      name="questionImageUpload"
                                      className="imageUploadInput"
                                      id={`optionImageUploadD${index + 1}`}
                                      onChange={(e) => {
                                        const name = `explanationImageUrl${
                                          index + 1
                                        }`;
                                        const REF = ref(storage, name);
                                        const file = e.target.files[0];
                                        const metadata = {
                                          contentType: file.type,
                                        };
                                        uploadBytes(REF, file, metadata)
                                          .then((snapshot) => {
                                            let temp = questions;
                                            temp[
                                              index
                                            ].explanationImageUrl = `https://firebasestorage.googleapis.com/v0/b/rlc-gate-test-portal.appspot.com/o/explanationImageUrl${
                                              index + 1
                                            }?alt=media`;
                                            setQuestions(temp);
                                            document.getElementById(
                                              `explanationImage${index + 1}`
                                            ).src = URL.createObjectURL(
                                              e.target.files[0]
                                            );
                                            document.getElementById(
                                              `explanationImage${index + 1}`
                                            ).style.display = "block";
                                            document.getElementById(
                                              `explanationImageText${index + 1}`
                                            ).style.display = "none";
                                            document.getElementById(
                                              `removeExplanationImage${
                                                index + 1
                                              }`
                                            ).style.display = "block";
                                            console.log(
                                              `Image for ${name} uploaded`
                                            );
                                          })
                                          .catch(console.error);
                                        // console.log(e.target.files[0]);
                                      }}
                                    />
                                    <button
                                      onClick={(e) => {
                                        let temp = questions;
                                        temp[index].explanationImageUrl = "";
                                        setQuestions(temp);
                                        document.getElementById(
                                          `explanationImage${index + 1}`
                                        ).style.display = "none";
                                        document.getElementById(
                                          `explanationImageText${index + 1}`
                                        ).style.display = "block";
                                        e.target.style.display = "none";
                                        document.getElementById(
                                          `optionImageUploadD${index + 1}`
                                        ).value = "";
                                        // Remove from database
                                        const name = `explanationImageUrl${
                                          index + 1
                                        }`;
                                        const REF = ref(storage, name);
                                        deleteObject(REF)
                                          .then(() => {
                                            console.log(
                                              `Image for ${name} deleted`
                                            );
                                          })
                                          .catch((error) => {
                                            console.log(error);
                                          });
                                      }}
                                      className="removeImageBtn"
                                      id={`removeExplanationImage${index + 1}`}
                                      style={{
                                        display:
                                          questions[index]
                                            .explanationImageUrl !== ""
                                            ? "block"
                                            : "none",
                                      }}
                                    >
                                      Remove Image
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="questionType">
                              <label htmlFor="questionType">
                                Question Type
                              </label>
                              <select
                                name="questionType"
                                id="questionType"
                                value={question.questionType}
                                onChange={(e) => {
                                  let quests = [...questions];
                                  quests[index].questionType = e.target.value;
                                  // console.log(e.target.value);
                                  setQuestions(quests);
                                }}
                              >
                                <option value="somcq">Single Option MCQ</option>
                                <option value="momcq">
                                  Multiple Option MCQ
                                </option>
                                <option value="numerical">Numerical</option>
                              </select>
                            </div>
                            <div className="marksOnCorrect">
                              <label htmlFor="marksOnCorrect">
                                Marks on Correct
                              </label>
                              <input
                                type="number"
                                name="marksOnCorrect"
                                id="marksOnCorrect"
                                placeholder="Enter marks on correct"
                                defaultValue={question.marksOnCorrect}
                                onChange={(e) => {
                                  let quests = [...questions];
                                  quests[index].marksOnCorrect = parseInt(
                                    e.target.value
                                  );
                                  setQuestions(quests);
                                }}
                              />
                            </div>
                            <div className="marksOnInCorrect">
                              <label htmlFor="marksOnInCorrect">
                                Marks on Incorrect
                              </label>
                              <input
                                type="text"
                                name="marksOnInCorrect"
                                id="marksOnInCorrect"
                                placeholder="Enter marks on incorrect"
                                defaultValue={question.marksOnIncorrect}
                                onChange={(e) => {
                                  let quests = [...questions];
                                  quests[index].marksOnIncorrect = parseFloat(
                                    e.target.value
                                  );
                                  setQuestions(quests);
                                }}
                              />
                            </div>
                            <div className="questionImageUpload">
                              <label htmlFor="questionImageUpload">
                                Upload Image
                              </label>
                              <div className="mainDivOption">
                                <img
                                  id={`questionImage${index + 1}`}
                                  src={questions[index].questionImageUrl}
                                  alt="questionImage"
                                  style={{
                                    display:
                                      questions[index].questionImageUrl !== ""
                                        ? "block"
                                        : "none",
                                  }}
                                />
                                <p
                                  id={`questionImageText${index + 1}`}
                                  style={{
                                    display:
                                      questions[index].questionImageUrl === ""
                                        ? "block"
                                        : "none",
                                  }}
                                >
                                  No image for this question
                                </p>
                                <div className="imageConsole">
                                  <input
                                    type="file"
                                    name="questionImageUpload"
                                    id="questionImageUpload"
                                    onChange={(e) => {
                                      const name = `q${index + 1}`;
                                      const REF = ref(storage, name);
                                      const file = e.target.files[0];
                                      const metadata = {
                                        contentType: file.type,
                                      };
                                      uploadBytes(REF, file, metadata)
                                        .then((snapshot) => {
                                          let temp = questions;
                                          temp[
                                            index
                                          ].questionImageUrl = `https://firebasestorage.googleapis.com/v0/b/rlc-gate-test-portal.appspot.com/o/q${
                                            index + 1
                                          }?alt=media`;
                                          setQuestions(temp);
                                          document.getElementById(
                                            `questionImage${index + 1}`
                                          ).src = URL.createObjectURL(
                                            e.target.files[0]
                                          );
                                          document.getElementById(
                                            `questionImage${index + 1}`
                                          ).style.display = "block";
                                          document.getElementById(
                                            `questionImageText${index + 1}`
                                          ).style.display = "none";
                                          console.log(
                                            `Image for ${name} uploaded`
                                          );
                                        })
                                        .catch(console.error);
                                      // console.log(e.target.files[0]);
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      let temp = questions;
                                      temp[index].questionImageUrl = "";
                                      setQuestions(temp);
                                      document.getElementById(
                                        `questionImage${index + 1}`
                                      ).style.display = "none";
                                      document.getElementById(
                                        `questionImageText${index + 1}`
                                      ).style.display = "block";
                                      // Remove from database
                                      const name = `q${index + 1}`;
                                      const REF = ref(storage, name);
                                      deleteObject(REF)
                                        .then(() => {
                                          console.log(
                                            `Image for ${name} deleted`
                                          );
                                        })
                                        .catch((error) => {
                                          console.log(error);
                                        });
                                    }}
                                    className="removeImageBtn"
                                  >
                                    Remove Image
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="questionPreview">
                              <label htmlFor="questionPreview">
                                Question Preview
                              </label>
                              <div className="questionPreviewDiv">
                                <p id={`questionPreviewText${index + 1}`}>
                                  {questions[index].q !== ""
                                    ? questions[index].q
                                    : ""}
                                </p>
                                <img
                                  id={`questionPreviewImage${index + 1}`}
                                  src={questions[index].questionImageUrl}
                                  alt="questionImage"
                                  style={{
                                    display:
                                      questions[index].questionImageUrl !== ""
                                        ? "block"
                                        : "none",
                                  }}
                                />
                                {/* Show options */}
                                {questions[index].questionType.includes(
                                  "mcq"
                                ) ? (
                                  <div className="optionsDiv">
                                    <p
                                      id={`option1Preview${index + 1}`}
                                      style={{
                                        display:
                                          questions[index].o1 !== ""
                                            ? "block"
                                            : "none",
                                      }}
                                    >
                                      {"◯ " + questions[index].o1}
                                    </p>
                                    <p
                                      id={`option2Preview${index + 1}`}
                                      style={{
                                        display:
                                          questions[index].o2 !== ""
                                            ? "block"
                                            : "none",
                                      }}
                                    >
                                      {"◯ " + questions[index].o2}
                                    </p>
                                    <p
                                      id={`option3Preview${index + 1}`}
                                      style={{
                                        display:
                                          questions[index].o3 !== ""
                                            ? "block"
                                            : "none",
                                      }}
                                    >
                                      {"◯ " + questions[index].o3}
                                    </p>
                                    <p
                                      id={`option4Preview${index + 1}`}
                                      style={{
                                        display:
                                          questions[index].o4 !== ""
                                            ? "block"
                                            : "none",
                                      }}
                                    >
                                      {"◯ " + questions[index].o4}
                                    </p>
                                  </div>
                                ) : null}
                                {questions.explanation !== "" ? (
                                  <p
                                    id={`explanationPreview${index + 1}`}
                                    style={{ marginTop: "10px" }}
                                  >
                                    <span
                                      style={{
                                        fontWeight: "bold",
                                        fontSize: "1rem",
                                      }}
                                    >
                                      Explanation:
                                    </span>{" "}
                                    {questions[index].explanation}
                                  </p>
                                ) : null}
                                {questions[index].explanationImageUrl !== "" ? (
                                  <img
                                    id={`explanationImagePreview${index + 1}`}
                                    src={questions[index].explanationImageUrl}
                                    alt="explanationImage"
                                  />
                                ) : null}
                              </div>
                            </div>
                            <button
                              className="removeBtn"
                              onClick={() => {
                                removeQuestion(index);
                              }}
                            >
                              Remove Question
                            </button>
                          </div>
                        </Collapsible>
                      );
                    })
                  : null}
              </div>
              <button className="addQuestionBtn" onClick={addQuestion}>
                Add a question
              </button>
              <div
                style={{ display: "flex", flexDirection: "row" }}
                className="questions"
              >
                <label htmlFor="testStartTime">Start Of Test: </label>
                <input
                  type="datetime-local"
                  name="testStartTime"
                  id="testStartTime"
                  defaultValue={ISOtoLocal(testStartTimestamp)}
                  onChange={(e) => {
                    setTestStartTimestamp(new Date(e.target.value));
                  }}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "row" }}
                className="questions"
              >
                <label htmlFor="testDuration">Duration(in minutes): </label>
                <input
                  type="text"
                  name="testDuration"
                  id="testDuration"
                  defaultValue={testDuration}
                  onChange={(e) => {
                    if (e.target.value === "") return;
                    setTestDuration(e.target.value);
                  }}
                />
              </div>
              <div className="btnGroup">
                <button
                  className="btn"
                  id="makeTestOnlineBtn"
                  onClick={changeStatus}
                >
                  Make Test {online ? "Offline" : "Online"}
                </button>
                <button
                  className="btn"
                  id="updateStudentBtn"
                  onClick={updateStudentDB}
                >
                  Update Student Database
                </button>
                <button className="btn" id="uploadTestBtn" onClick={uploadTest}>
                  Upload Test
                </button>
                <button className="btn" id="clearTestBtn" onClick={clearTest}>
                  Clear test
                </button>
                <button className="btn" id="logOutBtn" onClick={logout}>
                  Logout
                </button>
                <Toaster position="top-left" reverseOrder={false} />
              </div>
            </>
          ) : null
        ) : (
          navigate("/")
        )
      ) : null}
    </>
  );
}
