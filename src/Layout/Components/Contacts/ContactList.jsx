import React from "react";
import { SearchChat } from "../Chat";
import "./contact_list.sass";
import FlipMove from "react-flip-move";
import ContactTile from "../Chat/ContactTile";
import { useSelector } from "react-redux";
import { getContactsListSorted } from "../../../library/redux/selectors";
import { CircularLoader } from "hd-ui";
import { THEME_VARIABLES } from "../../../utils/enums";

const Contacts = () => {
  const contactList = useSelector(getContactsListSorted);

  const addShadow = ({ target }) => {
    if (target.scrollTop > 5) {
      target.dataset.showshadow = true;
    } else {
      target.dataset.showshadow = false;
    }
  };
  console.log(contactList);
  return (
    <div className="contact-list-container" data-showshadow={false} onScroll={addShadow}>
      {contactList.loading ? (
        <div className="contacts-loading">
          <CircularLoader width={30} loaderColor={THEME_VARIABLES.loaderColor} />
          Getting your contacts...
        </div>
      ) : contactList.hasData ? (
        <FlipMove className="flip-wrapper" style={{ paddingBottom: "15px" }}>
          {...contactList.data.map((contact) => {
            return (
              <div key={contact.id}>
                <ContactTile {...contact} />
              </div>
            );
          })}
        </FlipMove>
      ) : (
        <div className="no-contacts">
          <h3>No contacts in touch?</h3>
          Use Search👆 to find a person for chat...
          <br /> They will be added here.
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
