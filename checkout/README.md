# Checkout challenge documentation

## Transaction Life Cycle 💸

---

As recommended in the description of the challenge, I started by understanding how an online transaction works behind the scenes. After reading a few articles, I found one on the [PayPal website](<(https://www.paypal.com/us/webapps/mpp/bigcommerce/transactions/transaction-life-cycle)>) presenting the 4 statuses that a succesful transaction will go through in the Braintree Control Panel. Those are:

1. Authorized
2. Submitted for settlement
3. Settling
4. Settled

The first step is to authorize the transaction. In order for the transaction to become `Authorized`, the customer's bank should approve that the payment method is legitimate and has sufficient funds to pay the product or service requested. After that, the funds are still on the customer's account, but he is not able to spend that money.
The second status encountered is `Submitted for settlement` or Capture. Authorizations usually last for 29 days, so they will eventually expire. In order to collect funds a submit for settlement is required.
The third step is called `Settling` and it is a transitory state. Transaction is Settling while the payment is being processed.
The transaction is finally `Settled` when the money from the customer's bank account are transferred to the merchant account.

There are some additional statuses if something goes wrong: `Authorization expired`, `Processor declined`, `Failed`, `Voided`, `Gateway rejected - application incomplete`, `Settlement declined`, `Settlement pending`.

## PayPal documentation 📄

---

After finishing the initial research about online transactions, I moved on to PayPal documentation.

### Getting started

PayPal documentation has a very convenient page called [**Get Started**](<(https://developer.paypal.com/docs/business/get-started/)>) where the first steps to integrate PayPal Commerce Platform are explained. In order to get the API credentials, a sandbox account should be created. After logging in [here](<(https://developer.paypal.com/developer/applications)>) with your PayPal Account, the **My Apps & Credentials** tab on the left side of the page should be seen. A default application is automatically created by PayPal, and the credentials needed for the first part of the challenge can be found by clicking on it. Also, in the developer dashboard, under **Sandbox** menu, an **Accounts** tab can be seen. Here all the sanbox accounts (accounts to test purchases without affecting real money) can be managed. For this challenge I created a new personal account so that I can simulate a purchase later when I start coding.

### Client side

On the PayPal Checkout documentation page a [basic integration](https://developer.paypal.com/docs/checkout/integrate/) guide can be found. The documentation is clear and the 2 main functions `createOrder()` for setting up the transaction and `onApprove` for capturing the transaction are exaplained. `createOrder` takes 2 parameters: `data` and `actions`, the last one being used for calling PayPal using `actions.order.create()` to set up the details of the transaction. The default intent is set to `capture`, while the default `currency` is set to `USD`. The `onApprove` function is called after the buyer approves the transaction and it usually calls `actions.order.capture()`, but this is not applicable in our case. As suggested in the comments in the `client.js` file, when the order is approved, the `onAuthorizeTransaction()` method should be called so that the authorization will be handled on the server side.

### Server side

#### Authorize transaction

By checking the [Orders API](https://developer.paypal.com/docs/api/orders/v2/#orders_authorize) I found how to authorize a payment for oder. A POST request can be sent to `https://api-m.sandbox.paypal.com/v2/checkout/orders/{id}/authorize` where `id` is the `orderID` passed previously as a parameter on the client-side to the `onAuthorizeTransaction` function. The header parameters needed for this POST request are

```
  headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic <client_id:secret>`,
      }
```

There is no need of a body for the request so it should be left empty.
The response would return a `201` status code if the request was succesful with a JSON response body that shows all the important details of the transaction. From my understanding, even if the status code is `201`, order statuses like `VOIDED` (All purchase units in the order are voided) can appear in the body of the response. So multiple cases based on the transaction status should be handled.

#### Cancel transaction

Finding the documentation for cancelling the transaction was a bit tricky. I firstly looked on the same page as for the authorizing request, but nothing relevant could be found there. After some more research, I found how to [Void Authorized payment](https://developer.paypal.com/docs/api/payments/v2/#authorizations_void) on the Payments API. It looks pretty similar to the authorization request. A POST request should be sent to `https://api-m.sandbox.paypal.com/v2/payments/authorizations/{authorization_id}/void`, only this time an authorization id is needed. The same header parameters are needed for the void request:

```
  headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic <client_id:secret>`,
      }
```

There is also no need of a body for the request so it should be left empty.
If the request is successful, a `204` status code with no JSON response body would be returned.

## TypeScript: how is it different from JavaScript❓

---

This was my first interaction with TypeScript. I knew that it is a superset of the JavaScript programming language, meaning that it contains everything that JavaScript offers with some extra features. Further research was required for a better grasp of these extra features. [This](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html) page helped me understand the most important aspects of TypeScript.
One of them, as the name may suggest is the assignment of types. TypeScript checks if the types are assigned consistently. You can also define composed types such as: `type WindowStates = "open" | "closed" | "minimized";` where `WindowState` can only take one of the specified values. The main reason why TypeScript is preffered over JavaScript is that TypeScript offers better maintainability and better code navigation. It also helps in the prevention of bugs.

## Development ⌨️

---

### Adding credentials

In the `PayPal.ts` file a configuration object was already created, and the task was simply to copy the credentials and paste them into the file. After doing that, I quickly realized that this information should be private, and an `.env` file would be more suitable, but for the purpose of this challenge and for the ease of use I left the credentials hardcoded.

### Implemention of the renderPayPalButton() on the client side

I started implementing this method first as it is the first step in the process of creating, authorizing and capturing a transaction. This function is creating the order which is then sent to the server side, where the payment is authorized and then eventually cancelled or captured.
The `options` constant in the `renderPayPalButton()` is passed to the `paypal.Buttons()` function, and the `options` constant had to be implemented. This gave me a hint that this should be the place where the `createOrder` and `onApprove` functions discovered on the PayPal checkout documentation should be implemented.
Even though the default values for the `intent` and `currency` parameters are `CAPTURE` respectively `USD`, in the `setup.js` file, those parameters are set to `EUR` and `AUTHORIZE`. I still decided to override them in the `createOrder` function, since changes can be made to the SDK URL and the application needs those values so that it works as expected. The `purchase_units` property was given one purchase unit that has a `value` of `12.99`.
For the `onApprove` function, the comment left in the file was really helpful, thus the `onAuthorizeTransaction()` method was called inside it. There was only one problem: I didn't know where to find the `orderID` that had to be passed as an argument. I console logged the `data` and I was happy to find that `order.ID` is there. In the end this is how the `options` constant looks like without any comments:

```
const options = {
    createOrder: function (data, actions) {
      return actions.order.create({
        intent: 'AUTHORIZE',
        purchase_units: [
          {
            amount: {
              value: '12.99',
              currency: 'EUR',
            },
          },
        ],
      });
    },
    onApprove: function (data, actions) {
      return onAuthorizeTransaction(data.orderID);
    },
  };
```

### Implementation of the authorize() method

For this method the first thing I did was to store the URL needed for the POST request in a constant. In order to do so, a way to retrieve the `orderID` had to be found. By checking the type definitions in the `index.d.ts` file I managed to find the way how to access it. The next step after setting up the URL was to make the POST request. This was achieved by using the `HTTPClient.request()` with the URL as one argument and an object containing the headers, method and body as another argument. The headers were already known from the reasearch that was previously done. After sending some requests, only `Client Authentication Failed` errors were received. After some investigation I found out that the authorization property of the header should have the <cliend_id>:<clientSecret> base64 encoded. While searching on how to achieve this encoding, I found that I could use the `btoa()` method, but that would give me an error: `btoa()` could not be found. This led me to [this stackoverflow](https://stackoverflow.com/questions/23097928/node-js-throws-btoa-is-not-defined-error) which recommended to use the `Buffer` object. That's what I did and it worked, the request was finally successful.
The return of this method is of type `ParsedAuthorizationResponse` so a variable `authResponse` of this type was declared. After processing the response, the `authResponse` will receive the correct parameters and will be returned. The response had to be parsed to JSON in order to manipulate the data.
Three different HTTP status codes were distinguished during different requests: `201`, `401`, and `422`. Thus a switch statement was implemented in order to handle all of these cases.
In the case of a `201` HTTP status code, multiple transaction statuses can be distinguished, as presented in the documentation. Trying to see what happens if the customer has insufficient funds would lead to a `COMPLETED` status which was really strange. After logging in as the customer on the sandbox, a negative balance could be seen and I couldn't think of a different way to test this. I assumed that the status returned in the case of insufficient funds is `VOIDED`. Thus, an if statement in the `201` branch was implemented to check the status of the transaction. If the status is `VOIDED`, the `authResponse` object would get as parameters the `transactionStatus` which is set to `DECLINED` and the `declineReason` which is set to `Insufficient funds`. Otherwise I assumed the authorization to be successful and the `transactionStatus` property is set to `AUTHORIZED` and the `processordtransactionId` is set to the transactionId that could be found in the parsed to JSON response.
In the case of `401` HTTP status code, the credentials are invalid and the `authResponse` will get 2 properties: the `transactionStatus` which is set to `FAILED` and the `errorMessage` which is set to `Invalid credentials`.
In the case of a `422` HTTP status code, the transaction has already been authorized so the `transactionStatus` property is set to `FAILED` and the `errorMessage`property is set to `Transaction has already been authorized`.
All the other cases are covered in the default branch of the switch statement. Since the HTTP status code is different than `201` we consider that the authorization has failed so the `authResponse` object would get 2 properties: `transactionStatus` which is set to `FAILED` and `errorMessage` which is set to `The HTTP status code is different than 201, 401, 422. Unhandled Error!`.
Finally the `authResponse` of type `ParsedAuthorizationResponse` is returned.

### Implementation of the cancel() method

For this method I also started by storing the URL needed for the POST request. This time the `processorTransactionId` was needed. This one was easily found at `request.processorTransactionId` with the help of autocompletion. The <cllient_id:client_Secret> was again encoded to base64 and the `HTTPClient` was used in the same way as for the `authorize()` method. The return type of the function is `ParsedCancelResponse` so a `cancelResponse` variable of type `ParsedCancelResponse` is declared. After processing the response, the `cancelResponse` will receive the correct parameters and will be returned.
Three different scenarios can be distinguished for the HTTP status code of the response: `204`, `401` and `422`. Thus, a switch statement was implemented to properly handle these cases.
In the case of a `204` HTTP status code, as mentioned in the documentation, the cancellation was successful so the `cancelResponse` variable will get only one property, the `transactionStatus` which will be set to `CANCELLED`.
In the case of a `401` HTTP status code, the credentials are invalid, so the `cancelResponse` object will get 2 properties: `errorMessage` which is set to `Invalid credentials` and `transactionStatus` which is set to `FAILED`.
In the case of a `422` HTTP status code, the transaction has already been cancelled/voided, so the `cancelResponse` object will get 2 properties: `errorMessage` which is set to `Transaction has already been voided` and `transactionStatus` which is set to `FAILED`.
All other cases are covered in the default branch of the switch statement. Since the HTTP status code is different than `204` the cancellation has failed, so the `transactionStatus` property of the `cancelResponse` object is set to `FAILED`, while the `errorMessage` is set to `The HTTP status code is different than 204, 401, 422. Unhandled Error!`.
Finally, the `cancelResponse` object is returned by the method.

## Further Improvements 💡

---

Of course, there are a lot of improvements that can be made to this application.
First of all, on the server side, more testing is required for the `authorize()` and `cancel()` methods to make sure that all the possible HTTP status codes and transaction statuses are handled correctly. If needed, more cases in the switch statement can be easily added.
The second thing that could be improved is the user experience by providing visual feedback after creating the transaction. For example, after creating the order, the user would see a pop-up presenting the status of his order: authorized, denied, failed and so on. The same thing for cancelling the order.
Also, the cancel order button can be disabled after a successful cancellation of the order because multiple presses of this button would first result in successful cancellation, but all the others will return a `422` HTTP status code since the transaction was already cancelled.

## Conclusion 🎈

---

This technical exercise was really interesting and fun to do. I have to admit that it was really challenging since I encountered a lot of new things, one example being TypeScript. But believe me, I really enjoyed it. I had the opportunity to work for the first time with the PayPal API and develop an applcation that has a meaningful purpose. Sometimes I felt it like I'm doing a puzzle(I LOVE PUZZLES 🤩): trying to find the information I need in the app-framework or on the internet.
Overall, I learned a lot during this weekend and I think that my solution to the challenge is pretty good. I'm really looking forward to discussing it with you!
