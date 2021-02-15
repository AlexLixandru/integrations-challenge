let authResponse = null;

window.primer.setup().then(onLoad);

function renderPayPalButton() {
  const button = document.getElementById('paypal-button');

  /**
   * The PayPal SDK has been loaded with the client ID which you configured in PayPal.ts.
   *
   * Pass the correct options to the paypal SDK in order to create an order for EUR 12.99
   * When the order is approved, you should call `onAuthorizeTransaction(...)` with the orderID
   * that you receive from PayPal
   */
  const options = {
    //Creating an order with one purchase unit for EUR 12.99.
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
    //Before capturing, the transaction should be first authorized on the server side
    onApprove: function (data, actions) {
      return onAuthorizeTransaction(data.orderID);
    },
  };

  window.paypal.Buttons(options).render(button);
}

async function onLoad() {
  renderPayPalButton();

  document
    .getElementById('cancel-button')
    .addEventListener('click', onCancelTransaction);
}

function onAuthorizeTransaction(orderId) {
  fetch('/api/authorize', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  })
    .then((r) => r.json())
    .then((response) => {
      authResponse = response;
      document.getElementById('cancel-button').removeAttribute('disabled');
    });
}

function onCancelTransaction() {
  fetch('/api/cancel', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: authResponse.processorTransactionId }),
  });
}
