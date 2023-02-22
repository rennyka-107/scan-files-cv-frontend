import "./App.css";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import isEmpty from "lodash.isempty";
import debounce from "lodash.debounce";

function App() {
  const [dataSearch, setDataSearch] = useState([]);
  const [keyword, setKeyWord] = useState("");
  const [value, setValue] = useState("");
  const [keyState, setKeyState] = useState([]);
  const [countFilesCv, setCountFilesCv] = useState({
    scanned: 0,
    remaining: 0,
  });
  async function fetchData() {
    const result = await axios(
      `http://localhost:3000/cv/${
        isEmpty(keyword) ? "all" : keyword
      }?page=1&size=20`
    );
    if (result?.data?.result && result?.data?.result.length > 0) {
      setDataSearch(result?.data?.result);
      setKeyState(
        result?.data?.result.map((item) => ({ id: item.id, nextIndex: 0 }))
      );
    } else {
      setDataSearch([]);
      setKeyState([]);
    }
    getCountFilesScanned();
  }

  async function scanCv() {
    try {
      const result = await axios.post(`http://localhost:3000/cv/run-job-scan`);
      if (result?.data?.status) {
        setTimeout(fetchData, 1000);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function deleteAll() {
    try {
      const result = await axios.delete(
        `http://localhost:3000/cv/delete-index/cvs`
      );
      if (result?.data?.status) {
        fetchData();
        console.log("success");
      }
    } catch (err) {
      console.log(err);
    }
  }

  const debounceSearch = useCallback(
    debounce((nextValue) => {
      setKeyWord(nextValue);
    }, 1000),
    []
  );

  useEffect(() => {
    fetchData();
  }, [keyword]);

  function highlight(content, id = "") {
    let i = 0;
    const regex = new RegExp(keyword, "gi");
    return content.replace(regex, function (str) {
      return `<span id=${
        id + "-" + i++
      } style="color: red; font-weight: 500; font-size: 20px;">${str}</span>`;
    });
  }

  function calculateCountKeyword(content) {
    if (!isEmpty(keyword) && !isEmpty(content)) {
      return content.toLowerCase().split(keyword.toLowerCase()).length - 1;
    } else return 0;
  }

  async function getCountFilesScanned() {
    try {
      const result = await axios.get(
        "http://localhost:3000/cv/files-cv/get-files-scanned"
      );
      if (result?.data?.status) {
        setCountFilesCv({
          scanned: result?.data?.scanned,
          remaining: result?.data?.remaining,
        });
      } else {
        setCountFilesCv({
          scanned: 0,
          remaining: 0,
        });
      }
    } catch (err) {
      console.log(err);
    }
  }

  function scrollToKeyword(id, content) {
    const findItem = keyState.find((item) => item.id === id);
    const element = document.getElementById(id);
    const findIndex = document.getElementById(id + "-" + findItem.nextIndex);
    console.log(
      element.getBoundingClientRect().top,
      findIndex.getBoundingClientRect().top
    );
    if (element && findIndex) {
      element.scrollBy(
        0,
        findIndex.getBoundingClientRect().top -
          element.getBoundingClientRect().top
      );
    }
    const countKey = calculateCountKeyword(content);
    setKeyState(
      keyState.map((item) => {
        if (item.id !== id) {
          return item;
        } else {
          return {
            ...item,
            nextIndex: item.nextIndex + 1 >= countKey ? 0 : item.nextIndex + 1,
          };
        }
      })
    );
  }

  return (
    <div className="App">
      <h1 className="text-cyan-500 text-3xl mt-3">Search CV</h1>
      <div className="flex gap-[10px] mt-5 justify-center items-center">
        <label className="text-lg font-bold mr-3">Keyword</label>{" "}
        <input
          value={value}
          onChange={(e) => {
            if (!isEmpty(e.target.value)) {
              setValue(e.target.value);
              debounceSearch(e.target.value);
            } else {
              setValue("");
              debounceSearch("");
            }
          }}
          type="text"
          className="p-[10px] w-[500px] border rounded-md border-cyan-500"
        />
        <button
          onClick={scanCv}
          type="button"
          className="border border-cyan-300 rounded-md px-[20px] text-cyan-300 py-[10px] hover:bg-cyan-400 hover:text-white font-semibold"
        >
          Scan CV
        </button>
        <button
          onClick={deleteAll}
          type="button"
          className="border border-red-300 rounded-md px-[20px] text-red-300 py-[10px] hover:bg-red-400 hover:text-white font-semibold"
        >
          Delete all
        </button>
      </div>
      <div className="mt-3">
        <div>
          <span className="font-semibold text-cyan-500">Scanned: </span>
          <span>{countFilesCv.scanned}</span> files
        </div>
        <div>
          <span className="font-semibold text-yellow-500">Remaining: </span>
          <span>{countFilesCv.remaining}</span> files
        </div>
      </div>
      <div className="flex justify-center">
        <div className="w-[80%] mt-2 flex flex-wrap justify-start gap-[30px] p-[20px] ">
          {dataSearch?.map((cv) => (
            <div
              key={cv?.id + cv?.path}
              className="h-[500px] w-[31%] p-[15px] rounded-xl border-cyan-500 border"
            >
              <a
                href={"http://localhost:3000/" + cv.path}
                alt="link cv"
                className="font-bold italic hover:text-cyan-500"
                target="_blank"
              >
                {cv?.path.replace("cvs/", "")}
              </a>
              {!isEmpty(keyword) ? (
                <div className="w-full py-2 flex justify-between items-center">
                  <div>
                    <span className="text-black font-semibold">
                      Keyword count:{" "}
                    </span>
                    <span className="text-red-500">
                      {calculateCountKeyword(cv?.content)}
                    </span>
                  </div>
                  <button
                    onClick={() => scrollToKeyword(cv?.id, cv?.content)}
                    className="border border-cyan-500 py-[5px] px-[10px] rounded-lg text-cyan-500 hover:text-white hover:bg-cyan-500"
                  >
                    Find position
                  </button>
                </div>
              ) : (
                <></>
              )}
              <div
                id={cv?.id}
                className="mt-2 max-h-[380px] overflow-y-auto"
                dangerouslySetInnerHTML={{
                  __html: cv?.content
                    ? keyword
                      ? highlight(cv.content, cv?.id)
                      : cv.content
                    : "",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
