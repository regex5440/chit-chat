import React, { useState } from "react";
import { PlusIcon, MagnifyIcon } from "../../../../assets/icons";
import './search_people.sass';

const SearchChat = () => {
    const [searchText, setSearchText] = useState('');
    const [showClearIcon, setShowClearIcon] = useState(false);
    const handleInputFocus = () => {
        setShowClearIcon(true);
    }
    const handleInputBlur = () => {
        if (!searchText) {
            setShowClearIcon(false);
        }
    }
    const handleInputChange = (e) => {
        const inputText = e.target.value
        setSearchText(inputText);
        //Use input text to search for Contacts
    }
    const clearSearch = () => {
        setSearchText('');
        setShowClearIcon(false);
    }

    return <div className="search-container">
        <div className="search-container__input-container">
            <span className="input-icon-container">
                <MagnifyIcon className="magnify-icon" aria-hidden={showClearIcon} />
                <PlusIcon className="plus-icon" data-type={showClearIcon ? 'clear-cta' : 'search-zoom'} onClick={clearSearch} />
            </span>
            <input type='text' value={searchText} placeholder="Search or start a new chat" onFocus={handleInputFocus} onBlur={handleInputBlur} onChange={handleInputChange}></input>
        </div>
    </div>
}

export default SearchChat