import "./style.css";
import { useState, useEffect } from "react";
import QuestionEditor from "../QuestionEditor/page";
import StudentsSection from "../StudentsSection/page";
import { useAuthState } from "react-firebase-hooks/auth";
import { db, auth } from "../../../firebaseConfig";
import {
  collection,
  query,
  getDocs,
  updateDoc,
  doc,
  where,
} from "firebase/firestore";

export default function Admin() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, "admin"),
        where("email", "==", user.email)
      );
      getDocs(q).then((querySnapshot) => {
        if (querySnapshot.size === 0) {
          setIsAdmin(false);
        } else {
          setIsAdmin(true);
        }
      });
    }
  }, [user]);

  return (
    <>
      {isAdmin ? (
        <div className="adminMain">
          <div className="adminLeft">
            <span
              onClick={() => {
                setCurrentSection(1);
              }}
            >
              Set Questions
            </span>
            <span
              onClick={() => {
                setCurrentSection(2);
              }}
            >
              Students Section
            </span>
          </div>
          <div className="adminRight">
            {currentSection === 1 ? <QuestionEditor /> : <StudentsSection />}
          </div>
        </div>
      ) : (
        <h1>Not an admin</h1>
      )}
    </>
  );
}
