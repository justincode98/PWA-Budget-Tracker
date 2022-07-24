let db;
const request = indexedDB.open('budget_database', 1); //creates if does not exist, number on right indicates version

//event fires if version changes (probably not needed)
request.onupgradeneeded = function(event) {
    //saves reference to database
    const db = event.target.result;
    //create new table and set auto increment key
    db.createObjectStore('budget_table', {autoIncrement: true});

};

//fires on success
request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
    db = event.target.result;
  
    // check if app is online, if yes run checkDatabase() function to send all local db data to api
    if (navigator.onLine) {
      uploadBudget();
    }
  };
  
  //fires on error
  request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
  };


  
 function saveRecord(record) {
    //transaction opens tempory connection to database
    const transaction = db.transaction(['budget_table'], 'readwrite');
  
    const budgetObjectStore = transaction.objectStore('budget_table');
  
    // add record to your store with add method.
    budgetObjectStore.add(record);
  };

  //opens database to read data 
function uploadBudget() {
    const transaction = db.transaction(["budget_table"], 'readwrite');
    const budgetObjectStore = transaction.objectStore('budget_table');
    const getAll = budgetObjectStore.getAll(); //get all is asynchronous, requires event handler


getAll.onsuccess = function() {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(['budget_table'], 'readwrite');
          const budgetObjectStore = transaction.objectStore('budget_table');
          // clear all items in your store
          budgetObjectStore.clear();
        })
        .catch(err => {
          // set reference to redirect back here
          console.log(err);
        });
    }
  }
};

  window.addEventListener('online', uploadBudget);