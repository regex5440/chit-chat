import React, { useCallback, useState } from "react";
import { PlusIcon, MagnifyIcon } from "../../../../assets/icons";
import "./search_people.sass";
import ContactTile from "../ContactTile";
import { debounce } from "../../../../utils";
import { useDispatch, useSelector } from "react-redux";
import { updateSearchQuery, userSearchThunk } from "../../../../library/redux/reducers";
import { searchState } from "../../../../library/redux/selectors";

const SearchChat = () => {
  const [searchText, setSearchText] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const dispatch = useDispatch();
  const { query, loading, hasData, data } = useSelector(searchState);
  const setSearchQueryInStore = useCallback(
    debounce(
      (value) => {
        dispatch(updateSearchQuery(value));
        if (value) dispatch(userSearchThunk(value));
      },
      { duration: 500 }
    ),
    []
  );
  const handleInputFocus = () => {
    setInputFocused(true);
  };
  const handleInputBlur = () => {
    if (!searchText) {
      setInputFocused(false);
    }
  };
  const handleInputChange = (e) => {
    const inputText = e.target.value;
    setSearchText(inputText);
    setSearchQueryInStore(inputText);
  };
  const clearSearch = () => {
    setSearchText("");
    setInputFocused(false);
    dispatch(setSearchQueryInStore(""));
  };
  return (
    <div className="search-container">
      <div className="search-container__input-container">
        <span className="input-icon-container">
          <MagnifyIcon className="magnify-icon" aria-hidden={inputFocused} />
          <PlusIcon className="plus-icon" data-type={inputFocused ? "clear-cta" : "search-zoom"} onClick={clearSearch} />
        </span>
        <input type="text" value={searchText} placeholder="Search or start a new chat" onFocus={handleInputFocus} onBlur={handleInputBlur} onChange={handleInputChange} />
      </div>
      {inputFocused && query.length > 0 && (
        <div className="search-container__results-container">
          {loading ? (
            "Loading..."
          ) : //TODO: Add a loading icon
          hasData ? (
            <>
              {data.users && (
                <div className="users">
                  <div className="content">
                    <h3>Users</h3>
                    <div className="list">
                      {data.users.map((user, index) => {
                        return <ContactTile isConnection={false} avatar={{ url: user.url, key: user.key }} firstName={user.firstName} lastName={user.lastName} username={user.username} style={{ opacity: "0", animationDelay: `${index / 50}s` }} />;
                      })}
                    </div>
                  </div>
                </div>
              )}
              {data.groups && (
                <div className="groups">
                  <div className="content">
                    <h3>Groups</h3>
                    <div className="list">
                      {data.groups.map((group, index) => {
                        //TODO: Create a Component to show Group as tile
                        return <div>{group.name}</div>;
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            //TODO: A no results message
            "No Data"
          )}
        </div>
      )}
    </div>
  );
};

export default SearchChat;
