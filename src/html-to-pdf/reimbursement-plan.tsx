import { format } from "date-fns";

const formatDate = (date: Date | string | number) => {
  if (!date) return "";

  return format(new Date(date), "MMM dd, yyyy");
};

export const reimbursementPlanToHtml = (signature: string | null = null) => `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="" xml:lang="">
  <head>
    <title>Accountable Reimbursement Plan</title>

    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />

    <style>
      html {
        zoom: 0.8;
      }

      /* @font-face {
        font-family: "Proximanova-Regular";
        src: url("https://res.cloudinary.com/www-logic-square-com/raw/upload/v1679988971/general/ProximaNova-Regular.ttf");
        font-weight: 400;
      }

      @font-face {
        font-family: "Proximanova-SemiBold";
        src: url("https://res.cloudinary.com/www-logic-square-com/raw/upload/v1679988971/general/ProximaNova-SemiBold.ttf");
        font-weight: 600;
      } */

      body {
        font-family: "Proximanova-Regular";
        font-weight: 400;
        margin: 0;
        padding: 10px;
      }
      h1 {
        font-size: 20px;
        margin-bottom: 0;
        font-family: "Proximanova-SemiBold";
      }
      ol {
        margin: 0;
        padding-left: 20px;
      }
      ol li {
        margin-bottom: 10px;
        font-size: 16px;
      }
      strong {
        font-family: "Proximanova-SemiBold";
        font-weight: 600;
      }
      .hide {
        color: #ffffff;
        /* visibility: hidden; 
        position: absolute;
        user-select: none;
        pointer-events: none; */
      }
      .text-right {
        text-align: right !important;
      }
      .d-inline {
        display: inline !important;
      }
      .border-bottom {
        padding-bottom: 1px;
        border-bottom: 1px solid #131212;
      }
    </style>
  </head>

  <body>
    <h1 style="text-align: center">Accountable Reimbursement Plan</h1>

    <ol>
      <li>
        The Plan hereby adopts the requirements of Treas. Reg. Section 1.62-2
        and all other laws governing Accountable Reimbursement Plans & employee
        reimbursements. Any reimbursement or company policy that does not
        conform to current law is treated as though it is made through a
        separate, nonaccountable plan and is not a part of the Plan.
      </li>

      <li>
        The [Manager, CEO, or other officer title] of the Company retains the
        discretion to refuse reimbursement for any expense incurred by any
        employee, regardless of whether the expense meets the requirements of
        Treas. Reg. Section 1.62-2.
      </li>

      <li>
        Employees must document and substantiate all business expenses to the
        full extent of the law and in a timely fashion, as required by Treas.
        Reg. Section 1.62-2.
      </li>

      <li>
        No reimbursement shall be provided to employees by the Company unless
        reports and receipts are turned in on approved forms no more than 30
        calendar days after the expenses in question were incurred. Said reports
        and receipts may be submitted via email. The Company shall reimburse
        allowable and properly documented expenses no later than 15 days after
        receipt of correct & accurate reports & receipts from the employee and,
        in any event, no later than the last day of the calendar year.
      </li>

      <li>
        Only expenses incurred on bona-fide, legitimate Company business shall
        be reimbursed.
      </li>

      <li>
        All expenses, without exception, shall be documented by the employee
        with a brief description of the expense, the business purpose of the
        expense, the date incurred, and a receipt or invoice (email or
        electronic receipts & invoices are acceptable).
      </li>

      <li>
        Travel Out of Town (e.g., mileage, lodging, meals, parking, airfare,
        etc.). Reimbursement requests for Travel Out of Town shall also include
        amounts of each separate expenditure, date of departure, and date of
        return. The employee shall also indicate the number of days where at
        least 5 hours were spent on business (“Business Days”) with a
        description of the business conducted and the time during which it was
        conducted. The employee shall also indicate the number of Personal Days
        (days on which less than 5 hours of business were conducted). Weekend
        Days on which less than 5 hours of business were conducted shall count
        as Business Days if it was cheaper to stay Out of Town for the weekend
        day(s) than to return home on the last day (or the day after the last
        day) on which 5 hours of business was conducted. Only expenses incurred
        on Business Days shall be reimbursed by the Company.
      </li>

      <li>
        Business Meals. In addition to the requirements of #6, above,
        reimbursement requests for business meals shall include:

        <ol type="a">
          <li>Amount of each separate expenditure</li>
          <li>Date of the meal</li>
          <li>Place (name and location)</li>
          <li>Business reason</li>
          <li>Names and business relationship of all persons at the meal</li>
        </ol>
      </li>

      <li>
        Entertainment (e.g., shows, golf, shooting, sports tickets, etc.)
        expenses shall not be reimbursed by the Company.
      </li>

      <li>
        Gifts for Customers or Prospective Customers. Gifts for customers or
        prospective customers shall be reimbursable up to a maximum of $25/gift,
        with no more than one gift given to a customer/prospective customer per
        calendar year. The Company does not permit “disguised gifts” (e.g.,
        gifts over $25 relabeled as “promotional expense”, “advertising”, etc.)
        and no reimbursement shall be provided for such expenditures. All
        reimbursement requests for Gifts shall include:

        <ol type="a">
          <li>Cost of the gift</li>
          <li>Date of the gift</li>
          <li>Description of the gift</li>
          <li>Business purpose</li>
          <li>Name and business relationship of the recipient</li>
        </ol>
      </li>
    </ol>

    <div>
      <!-- officer -->
      <div style="margin-top: 80px">
        <p class="text-right">
          <span
            class="border-bottom"
            style="display: inline-block; min-width: 250px"
          >
            ${
              signature
                ? `<img style='max-width: 250px; height: auto' src="${signature}" alt="Signature" />`
                : ""
            }
          </span>
        </p>
      </div>
      <!-- date -->
      <div style="margin-top: 40px">
        <p class="text-right">
          <span
            class="border-bottom"
            style="display: inline-block; min-width: 250px"
          >
            <span>${formatDate(new Date())}</span>
          </span>
        </p>
        <p class="text-right">Sign Date</p>
      </div>
    </div>
  </body>
</html>
`;
