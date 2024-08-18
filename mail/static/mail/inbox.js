
window.onpopstate = function (event) {

  document.activeElement.blur();

  if (event.state.mailbox !== 'compose') {
    load_mailbox(event.state.mailbox);
  } else {
    compose_email();
  }

}


document.addEventListener('DOMContentLoaded', function () {

  document.querySelectorAll('button').forEach(button => {
    button.onclick = function () {
      const mailbox = this.dataset.page;

      // Add the current state to the history
      history.pushState({ mailbox: mailbox }, '', `${mailbox}`);

    };
  });

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  // By default, load the inbox
  load_mailbox('inbox');
  return false;
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#reply-view').style.display = 'none';


  document.querySelector('#compose-form').addEventListener('submit', sendMail);

  //Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  return false;
}


function sendMail() {
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    headers: {
      "Content-Type": "text/plain"
    },
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
    .then(response => response.json())
    .then(result => {
      console.log('RESULT:', result);
      history.pushState({ sent: 'sent' }, '', '/sent');
      load_mailbox('sent');
    })
    .catch(error => {
      console.log('Error here:', error);
    });

  //return false;
}

//display reply email view
function reply_email(id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#reply-view').style.display = 'block';

  document.querySelector('#reply-form').addEventListener('submit', replyMail);

  return false;
}


function replyMail() {
  const recipients = document.querySelector('#reply-recipients').value;
  const subject = document.querySelector('#reply-subject').value;
  const body = document.querySelector('#reply-body').value;

  fetch('/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
    .then(response => response.json())
    .then(result => {
      console.log('RESULT:', result);
      history.pushState({ sent: 'sent' }, '', '/sent');
      load_mailbox('sent');
    })
    .catch(error => {
      console.log('Error here:', error);
    });

  return false;
};


//show emails according to view chosen
function boxView(view) {

  function createTh(innerHTML, scope = 'col') {
    const th = document.createElement('th');
    th.scope = scope;
    th.innerHTML = innerHTML;
    return th;
  }

  //create the framework for the inbox layout
  const parent = document.querySelector('#emails-view');
  const firstNode = document.createElement('div');
  firstNode.className = 'row';
  const secondNode = document.createElement('div');
  secondNode.className = 'col-12';
  const table = document.createElement('table');
  table.className = 'table table-bordered';
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  const th1 = createTh('From');
  const th2 = createTh('Subject');
  const th3 = createTh('To');
  const th4 = createTh('Time');
  const th5 = createTh('Actions');
  tr.appendChild(th1);
  tr.appendChild(th2);
  tr.appendChild(th3);
  tr.appendChild(th4);
  tr.appendChild(th5);
  thead.appendChild(tr);
  table.appendChild(thead);
  secondNode.appendChild(table);


  fetch(`/emails/${view}`)
    .then(response => response.json())
    .then(emails => {
      //loop through the emails
      emails.forEach(email => {
        // create a row for each mail
        const tbody = document.createElement('tbody');
        const bodyRow = document.createElement('tr');

        //create columns for the email view
        const from = createTh(email.sender, 'row');
        from.innerHTML = email.sender;
        const timestamp = document.createElement('td');
        timestamp.innerHTML = email.timestamp;
        const recipients = document.createElement('td');
        recipients.innerHTML = email.recipients[0];
        const subject = document.createElement('td');

        //truncate subject field
        const len = email.subject.length;
        if (len < 12) {
          subject.innerHTML = email.subject
        } else {
          subject.innerHTML = email.subject.slice(0, 10) + '...';
        }

        bodyRow.appendChild(from);
        bodyRow.appendChild(subject);
        bodyRow.appendChild(recipients);
        bodyRow.appendChild(timestamp);


        //create buttons to navigate
        const actions = document.createElement('td');
        const link = document.createElement('a');
        link.setAttribute('id', `${email.id}`);

        link.className = 'btn btn-outline-primary';
        link.innerText = 'Open';

        const unreadButton = document.createElement('button');
        unreadButton.innerHTML = 'Unread';
        unreadButton.className = 'btn btn-outline-secondary';

        const archive = document.createElement('button');
        archive.className = 'btn btn-outline-secondary';


        //hide unread button if email is unread
        if (!email.read) {
          unreadButton.style.display = 'none';
        }

        unreadButton.addEventListener('click', () => {
          markUnread(email.id)
          bodyRow.style.backgroundColor = 'white';
          unreadButton.style.display = 'none';
        });


        //change the background color to gray when email is read
        if (email.read) {
          unreadButton.style.display = 'block';
          bodyRow.style.backgroundColor = '#f1f1f1';
        }

        //change the background color to white when email is unread
        if (!email.read) {
          bodyRow.style.backgroundColor = 'white';
        }


        // change 'archive' button to 'remove from archive' button in archive view
        if (view === 'archive') {
          archive.innerHTML = 'Remove';
        } else if (view === 'sent') {
          archive.style.display = 'none';
        } else {
          archive.innerHTML = 'Archive';
        }

        actions.append(link)
        actions.appendChild(unreadButton);
        actions.appendChild(archive);
        bodyRow.appendChild(actions);


        tbody.appendChild(bodyRow);
        table.appendChild(tbody);

        // archive email
        archive.addEventListener('click', () => {
          archiveMail(email.id, email.archived);
        }, true);



        //show email detail when clicked
        if (link) {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            history.pushState(null, null, `email=${email.id}`);
            return getEmail(email.id, view);
          })
        }

        firstNode.appendChild(secondNode);
        parent.appendChild(firstNode);

      })

    });
  return false;
}


function archiveMail(id, archived) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !archived
    })
  });
  window.location = '/inbox';
  return false;
}



function markRead(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });
}


function markUnread(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: false
    })
  });
}


//show email detail
function getEmail(id, view) {
  const parent = document.querySelector('#email-view');

  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      console.log("email", email);
      let subject = email.subject;
      document.querySelector('#sender').value = email.sender;
      document.querySelector('#recipients').value = email.recipients[0];
      document.querySelector('#subject').value = email.subject;
      document.querySelector('#body').value = `${email.timestamp}:\n${email.body}`;
      markRead(id);

      //replying email from sent view
      if (view === 'sent') {
        document.querySelector('#reply').addEventListener('click', (e) => {
          e.preventDefault();
          document.querySelector('#reply-recipients').setAttribute('value', email.recipients[0]);

          if (subject.startsWith('Re:')) {
            document.querySelector('#reply-subject').setAttribute('value', `${email.subject}`);
          } else {
            document.querySelector('#reply-subject').setAttribute('value', `Re: ${email.subject}`);
          }

          document.querySelector('#reply-body').innerHTML = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
          history.replaceState(null, null, `reply?${email.id}`);
          reply_email(id);
        });

      } else {
        //set recipients to sender replying from the inbox view
        document.querySelector('#reply').addEventListener('click', (e) => {
          e.preventDefault();
          document.querySelector('#reply-recipients').setAttribute('value', email.sender);

          if (subject.startsWith('Re:')) {
            document.querySelector('#reply-subject').setAttribute('value', `${email.subject}`);
          } else {
            document.querySelector('#reply-subject').setAttribute('value', `Re: ${email.subject}`);
          }

          document.querySelector('#reply-body').innerHTML = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
          history.replaceState(null, null, `reply?${email.id}`);
          reply_email(id);
        });

      }

    });

  document.querySelector('#archive').addEventListener('click', (e) => {
    e.preventDefault();
    archiveMail(id)
  });

  //show email detail, hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';


}


function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#reply-view').style.display = 'none';

  boxView(mailbox);

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  return false;
}
