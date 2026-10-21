import { ModusWcAlert } from '@trimble-oss/moduswebcomponents-react';

export type OrderConfirmationBannerProps = {
  hasSpecialInstructions: boolean;
  salesOrderNumber: string;
  confirmationEmail: string;
};

export default function OrderConfirmationBanner({
  hasSpecialInstructions,
  salesOrderNumber,
  confirmationEmail,
}: OrderConfirmationBannerProps) {
  const emailAndBilling = `A confirmation email has been sent to ${confirmationEmail}. Note: Payment will appear as 'Trimble' on your billing statement.`;

  if (hasSpecialInstructions) {
    return (
      <ModusWcAlert
        variant="warning"
        icon="warning"
        alertTitle="Order received — pending manual shipping review"
        alertDescription={`Your order ${salesOrderNumber} contains non-standard shipping requests. Fulfillment is on hold while Trimble Operations reviews your instructions. ${emailAndBilling}`}
        customClass="order-confirmation-banner"
      />
    );
  }

  return (
    <ModusWcAlert
      variant="success"
      icon="check_circle"
      alertTitle="Order confirmed and submitted to fulfillment"
      alertDescription={`Thank you for your order! Order number ${salesOrderNumber} has been received and is being processed. ${emailAndBilling}`}
      customClass="order-confirmation-banner"
    />
  );
}
