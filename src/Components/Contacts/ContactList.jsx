import React from "react";
import { SearchChat } from "../Chat";
import "./contact_list.sass";
import FlipMove from "react-flip-move";
import ContactTile, { UserTileType } from "../Chat/ContactTile";
import { useSelector } from "react-redux";
import { getContactsListSorted, getTempConnection } from "../../library/redux/selectors";
import { CircularLoader } from "hd-ui";

const Contacts = () => {
  const contactList = useSelector(getContactsListSorted);
  const tempContact = useSelector(getTempConnection);

  const addShadow = ({ target }) => {
    if (target.scrollTop > 5) {
      target.dataset.showshadow = true;
    } else {
      target.dataset.showshadow = false;
    }
  };
  return (
    <div className="contact-list-container" data-showshadow={false} onScroll={addShadow}>
      {contactList.loading ? (
        <div className="contacts-loading">
          <CircularLoader size={30} riderColor={"var(--icon-stroke)"} />
          Getting your contacts...
        </div>
      ) : contactList.hasData || tempContact ? (
        <FlipMove className="flip-wrapper" style={{ paddingBottom: "15px" }}>
          {tempContact && (
            <div>
              <ContactTile TYPE={UserTileType.USER} {...tempContact} />
            </div>
          )}
          {...contactList.data.map((contact) => {
            return (
              <div key={contact.id}>
                <ContactTile TYPE={UserTileType.CONNECTION} {...contact} />
              </div>
            );
          })}
        </FlipMove>
      ) : (
        <div className="no-contacts">
          {contactList.searchResults ? (
            <h3>Connection not found</h3>
          ) : (
            <>
              <h3>No contacts in touch?</h3>
              Use Search👆 to find a person for chat...
              <br /> They will be added here.
            </>
          )}
        </div>
      )}
    </div>
  );
};

const ContactList = () => {
  return (
    <div className="contact-list-main-container">
      <SearchChat />
      <Contacts />
    </div>
  );
};

export default ContactList;
