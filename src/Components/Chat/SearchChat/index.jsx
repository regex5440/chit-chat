import React, { useCallback, useEffect, useState } from "react";
import { PlusIcon, MagnifyIcon } from "../../../assets/icons";
import "./search_people.sass";
import ContactTile, { UserTileType } from "../ContactTile";
import { debounce } from "../../../utils";
import { useDispatch, useSelector } from "react-redux";
import { updateSearchQuery, userSearchThunk } from "../../../library/redux/reducers";
import { getDeviceDetails, getTempConnection, searchState } from "../../../library/redux/selectors";
import { CircularLoader } from "hd-ui";

const SearchChat = () => {
  const [searchText, setSearchText] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const dispatch = useDispatch();
  const { query, loading, hasData, data } = useSelector(searchState);
  const tempSelectedUser = useSelector(getTempConnection);
  const device = useSelector(getDeviceDetails);
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
  useEffect(() => {
    if (tempSelectedUser) {
      clearSearch();
    }
  }, [tempSelectedUser]);
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
    setSearchQueryInStore(inputText.trim().toLowerCase());
  };
  const clearSearch = () => {
    setSearchText("");
    setInputFocused(false);
    setSearchQueryInStore("");
  };
  return (
    <>
      <div className="search-container">
        <div className="search-container__input-container">
          <span className="input-icon-container">
            <MagnifyIcon className="magnify-icon" aria-hidden={inputFocused} />
            <PlusIcon className="plus-icon" data-type={inputFocused ? "clear-cta" : "search-zoom"} onClick={clearSearch} />
          </span>
          <input type="text" value={searchText} placeholder="Search or start a new chat" onFocus={handleInputFocus} onBlur={handleInputBlur} onChange={handleInputChange} />
        </div>
      </div>
      {inputFocused && query.length > 2 && (
        <div className="search-container__results-container">
          {loading ? (
            <div className="loader-container">
              <CircularLoader size={50} riderColor={"var(--text-secondary-color)"} />
            </div>
          ) : hasData ? (
            <>
              {data.users.length > 0 && (
                <div className="users">
                  <div className="content">
                    <h3>All Users</h3>
                    <div className="list">
                      {data.users.map((user, index) => {
                        return <ContactTile TYPE={UserTileType.USER} isConnection={false} avatar={user.avatar} firstName={user.firstName} lastName={user.lastName} username={user.username} style={{ opacity: "0", animationDelay: `${index / 50}s` }} bio={user.about} id={user.id} />;
                      })}
                    </div>
                  </div>
                </div>
              )}
              {data.groups.length > 0 && (
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
            <div className="no-data-container">No result found on Chit Chat</div>
          )}
        </div>
      )}
    </>
  );
};

export default SearchChat;
