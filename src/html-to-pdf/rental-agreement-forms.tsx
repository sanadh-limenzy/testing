import { UserAddress } from "@/@types";
import {
  getRentalTimeSlots,
  formatCurrencyValue,
  formatAddressInSingleText,
} from "../helpers/formatter";
import { UserProfile } from "@/@types/user";

interface Event {
  start_time?: string;
  end_time?: string;
  description?: string;
  people_count?: number;
  peopleCount?: number;
  excluded_areas?: string;
}

interface DailyAmount {
  date: string;
  amount: number;
}

/**
 * @description
 * This function generates a comprehensive rental agreement HTML document that includes:
 * - Event details and rental information
 * - Lessee (business) information
 * - Lessor (property owner) information
 * - Legal agreement terms and conditions
 * - Signature blocks for both parties
 * - Styled CSS for professional appearance
 *
 * The generated HTML includes:
 * - Event description, dates, times, and attendee count
 * - Rental costs calculated from daily amounts
 * - Property and business addresses
 * - Standard rental agreement clauses covering property use, payment, cancellation, parking, restrictions, and jurisdiction
 * - Signature areas with hidden placeholders for digital signing
 *
 * @example
 * const proposal = {
 *   _activity: {
 *     description: "Corporate team building event",
 *     startTime: "14:00",
 *     endTime: "18:00",
 *     peopleCount: 25,
 *     excludedAreas: "Master bedroom, home office"
 *   },
 *   _rentalAddress: { state: "California" },
 *   _businessAddress: { businessName: "Tech Corp Inc." }
 * };
 *
 * const user = {
 *   name: { first: "John", last: "Doe" },
 *   email: "john@example.com",
 *   phone: "555-1234"
 * };
 *
 * const dailyAmounts = [
 *   { date: "2024-01-15", amount: 500.00 }
 * ];
 *
 * const htmlString = rentalAgreementToHtml(
 *   proposal, user, event, dailyAmounts,
 *   rentalAddress, businessAddress, "Master bedroom"
 * );
 *
 * @since 1.0.0
 */
const rentalAgreementToHtml = (
  user: UserProfile,
  event: Event,
  dailyAmounts: DailyAmount[],
  rentalAddress: UserAddress,
  businessAddress: UserAddress,
  excludedAreas?: string | null
): string => {
  const startTime = event?.start_time || "N/A";
  const endTime = event?.end_time || "N/A";
  const rentalTimeSlots = getRentalTimeSlots(dailyAmounts, startTime, endTime);

  const user_name =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || "N/A";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Rental Agreement</title>
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
          .time-slots {
            margin: 10px 0;
            padding-left: 20px;
          }
          .time-slots li {
            margin-bottom: 5px;
            font-size: 14px;
          }
        </style>
      </head>
    
      <body>
        <h1 style="text-align: center">Rental Agreement</h1>
    
        <h1>The Event and Rent</h1>
        <p>
          Event Description:
          <span class="border-bottom" style="line-height:1.4;">${
            event?.description
          }</span>
        </p>
        <p>
          Date of Event:
        </p>
        <ul class="time-slots">
          ${rentalTimeSlots.map((slot) => `<li>${slot}</li>`).join("")}
        </ul>
        <p>
          Time of Event From:
          <span class="border-bottom">${startTime || "N/A"}</span>
          To:
          <span class="border-bottom">${endTime || "N/A"}</span>
        </p>
        <p>
          Number of People Attending:
          <span class="border-bottom">
            ${event?.people_count || event?.peopleCount || "N/A"}
          </span>
        </p>
        <p>
          Rent for the Date & Times of the Event:
          <span class="border-bottom">
            ${formatCurrencyValue(
              dailyAmounts.reduce((acc, curr) => acc + curr.amount, 0)
            )}
          </span>
        </p>
        <p>
          Address of the Property to be Rented:
          <span class="border-bottom">
            ${formatAddressInSingleText(rentalAddress)}
          </span>
        </p>
    
        <h1>Lessee Information</h1>
        <p>
          Name of Lessee:
          <span class="border-bottom">${businessAddress?.business_name}</span>
        </p>
        <p>
          Address:
          <span class="border-bottom">${formatAddressInSingleText(
            businessAddress
          )}</span>
        </p>
        <p>
          Telephone No.:
          <span class="border-bottom">
            ${businessAddress?.business_phone_code} ${
    businessAddress?.business_phone
  }
          </span>
        </p>
        <p>Email: <span class="border-bottom">${
          businessAddress?.business_email
        }</span></p>
    
        <h1>Lessor Information</h1>
        <p>
          Name of Lessor:
          <span class="border-bottom">
            ${user_name}
          </span>
        </p>
        <p>
          Address:
          <span class="border-bottom">${formatAddressInSingleText({
            street: user?.street,
            apartment: user?.apartment,
            city: user?.city,
            state: user?.state,
            zip: user?.zip,
          })}</span>
        </p>
        <p>
          Telephone No.:
          <span class="border-bottom">${user?.phone_code || ""} ${
    user?.phone || "N/A"
  }</span>
        </p>
        <p>Email: <span class="border-bottom">${user?.email || "N/A"}</span></p>
    
        <h1>Agreement</h1>
        <p>
          In exchange for the use of the Property, I hereby agree that I have read,
          understood and agreed to abide by the terms, conditions and
          responsibilities outlined in this Agreement.
        </p>
        <ol>
          <li>
            <p><u>Property</u></p>
    
            The Property is the single-family residence located at the Address
            above. The Lessee and its guests shall have access to the entire
            Property (including furnishings) on the specified Date & Times except
            for the following areas:<br />
            <span class="border-bottom" style="padding-bottom: 1px">
              ${excludedAreas ? event?.excluded_areas : "N/A"}
            </span>
            and any other room clearly marked by the Lessor as "Do Not Enter". The
            Property is leased on an "as is" basis. The Property may only be used
            for the Event described above. The Property may not be used for any
            illegal purposes.
          </li>
    
          <li>
            <p><u>Payment of the Rent</u></p>
    
            The Rent shall be paid within ten (10) calendar days of Lessee being
            invoiced by the Lessor.
          </li>
    
          <li>
            <p><u>Cancellation</u></p>
    
            In the event of cancellation any Rent paid shall be returned in full.
          </li>
    
          <li>
            <p><u>Parking</u></p>
    
            The Lessee and its guests shall park in the driveway or on-street
            without blocking other residences' ingress & egress. No vehicles shall
            be parked on the lawn. The Lessee and its guests bear full
            responsibility for all vehicles and the contents of said vehicles.
          </li>
    
          <li>
            <p><u>Restrictions</u></p>
    
            <ol type="a">
              <li>
                Nothing may be pinned, nailed or stapled to any wall, door, ceiling
                or floor. Adhesion with masking tape or similar materials that leave
                permanent markings or discoloration are permissible.
              </li>
              <li>
                Smoking is NOT permitted anywhere on the Property at any time unless
                expressly agreed to by both parties in writing.
              </li>
              <li>
                The Lessee shall ensure that Property (including, but not limited to
                detritus & garbage being properly bagged, dishes & utensils being
                cleaned, etc.) shall be left in the same condition that existed at
                the beginning of rental of the Property.
              </li>
              <li>
                Lessee acknowledges that the Property is located near residential
                and commercial areas and therefore agrees to control the noise level
                at the Event such that it does not disturb neighboring occupants. In
                the event that Lessee's Event creates a disturbance due to high
                noise volume, Lessee shall immediately reduce the volume. If
                repeated disturbances are created, at Lessor's discretion, Lessee
                may be expelled from the Property or the offending noise ended by
                the Lessor. In the event of disturbances to the point of expulsion,
                no portion of the Rent shall be refunded.
              </li>
            </ol>
          </li>
    
          <li>
            <p><u>Changes to This Agreement</u></p>
    
            All changes, additions, and deletions shall not be considered agreed to
            or binding to the other unless such modifications have been initiated or
            otherwise approved in writing by both parties to this Agreement.
          </li>
    
          <li>
            <p><u>Acceptance</u></p>
    
            This Agreement will constitute a binding contract between the parties.
            The individuals signing below represent that each is Listed to bind his
            or her party to this Agreement.
          </li>
    
          <li>
            <p><u>Jurisdiction</u></p>
    
            The laws of ${rentalAddress?.state} shall govern
            this Agreement.
          </li>
        </ol>
    
        <p>I have read and agree to the policies and procedures attached.</p>
    
        <div style="margin-top: 80px">
          <p>
            <strong 
                class="border-bottom"
                style="display: inline-block; min-width: 250px"
            > ${businessAddress?.business_name} </strong>
          </p>
          <p>Lessee Printed Name & Title</p>
        </div>
    
        <div style="margin-top: 40px">
          <p>
            <span
              class="border-bottom"
              style="display: inline-block; min-width: 250px"
            >
              <!-- ${
                user?.first_name || user?.first_name + " " + user?.last_name
              } -->
              <span class="hide">/business-form-sign/</span>
            </span>
          </p>
          <p>Lessee Signature</p>
        </div>
    
        <div style="margin-top: 40px">
          <p>
            <span
              class="border-bottom"
              style="display: inline-block; min-width: 250px"
            >
              <span class="hide">/business-form-date/</span>
            </span>
          </p>
          <p>Lessee Sign Date</p>
        </div>
    
        <div style="margin-top: 40px">
          <p>
            <strong>
              <span 
                class="border-bottom"
                style="display: inline-block; min-width: 250px"
                >
                ${user_name}
              </span>
            </strong>
          </p>
          <p>Lessor Printed Name & Title</p>
        </div>
    
        <div style="margin-top: 40px">
          <p>
            <span
              class="border-bottom"
              style="display: inline-block; min-width: 250px"
            >
              <!-- ${
                user?.first_name || user?.first_name + " " + user?.last_name
              } -->
              <span class="hide">/form-sign/</span>
            </span>
          </p>
          <p>Lessor Signature</p>
        </div>
        <div style="margin-top: 40px">
          <p>
            <span
              class="border-bottom"
              style="display: inline-block; min-width: 250px"
            >
              <span class="hide">/form-date/</span>
            </span>
          </p>
          <p>Lessor Sign Date</p>
        </div>
      </body>
    </html>
    `;
};

const signedRentalAgreementToHtml = (
  user: UserProfile,
  event: Event,
  dailyAmounts: DailyAmount[],
  rentalAddress: UserAddress,
  businessAddress: UserAddress,
  excludedAreas: string | null,
  lessee_signature: string,
  lessor_signature: string
) => {
  const start_time = event?.start_time || "N/A";
  const end_time = event?.end_time || "N/A";
  const rentalTimeSlots = getRentalTimeSlots(
    dailyAmounts,
    start_time,
    end_time
  );

  const user_name =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || "N/A";

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rental Agreement</title>
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
        .time-slots {
        margin: 10px 0;
        padding-left: 20px;
      }
      .time-slots li {
        margin-bottom: 5px;
        font-size: 14px;
      }
    </style>
  </head>

  <body>
    <h1 style="text-align: center">Rental Agreement</h1>

    <h1>The Event and Rent</h1>
    <p>
      Event Description:
      <span class="border-bottom" style="line-height:1.4;">${
        event?.description
      }</span>
    </p>
    <p>
      Date of Event:
   
    </p>
     <ul class="time-slots">
      ${rentalTimeSlots.map((slot) => `<li>${slot}</li>`).join("")}
    </ul>
    <p>
      Time of Event From:
      <span class="border-bottom">${event?.start_time}</span>
      To:
      <span class="border-bottom">${event?.end_time}</span>
    </p>
    <p>
      Number of People Attending:
      <span class="border-bottom">
        ${event?.people_count || "N/A"}
      </span>
    </p>
    <p>
      Rent for the Date & Times of the Event:
      <span class="border-bottom">
        ${formatCurrencyValue(
          dailyAmounts.reduce((acc, curr) => acc + curr.amount, 0)
        )}
      </span>
    </p>
    <p>
      Address of the Property to be Rented:
      <span class="border-bottom">
        ${formatAddressInSingleText(rentalAddress)}
      </span>
    </p>

    <h1>Lessee Information</h1>
    <p>
      Name of Lessee:
      <span class="border-bottom">${businessAddress?.business_name}</span>
    </p>
    <p>
      Address:
      <span class="border-bottom">${formatAddressInSingleText(
        businessAddress
      )}</span>
    </p>
    <p>
      Telephone No.:
      <span class="border-bottom">
        ${businessAddress?.business_phone_code} ${
    businessAddress?.business_phone
  }
      </span>
    </p>
    <p>Email: <span class="border-bottom">${
      businessAddress?.business_email
    }</span></p>

    <h1>Lessor Information</h1>
    <p>
      Name of Lessee:
      <span class="border-bottom">
        ${user_name}
      </span>
    </p>
    <p>
      Address:
      <span class="border-bottom">${formatAddressInSingleText({
        street: user?.street,
        apartment: user?.apartment,
        city: user?.city,
        state: user?.state,
        zip: user?.zip,
      })}</span>
    </p>
    <p>
      Telephone No.:
      <span class="border-bottom">${user?.phone_code} ${user?.phone}</span>
    </p>
    <p>Email: <span class="border-bottom">${user?.email}</span></p>

    <h1>Agreement</h1>
    <p>
      In exchange for the use of the Property, I hereby agree that I have read,
      understood and agreed to abide by the terms, conditions and
      responsibilities outlined in this Agreement.
    </p>
    <ol>
      <li>
        <p><u>Property</u></p>

        The Property is the single-family residence located at the Address
        above. The Lessee and its guests shall have access to the entire
        Property (including furnishings) on the specified Date & Times except
        for the following areas:<br />
        <span class="border-bottom" style="padding-bottom: 1px">
          ${excludedAreas ? excludedAreas : "N/A"}
        </span>
        and any other room clearly marked by the Lessor as “Do Not Enter”. The
        Property is leased on an “as is” basis. The Property may only be used
        for the Event described above. The Property may not be used for any
        illegal purposes.
      </li>

      <li>
        <p><u>Payment of the Rent</u></p>

        The Rent shall be paid within ten (10) calendar days of Lessee being
        invoiced by the Lessor.
      </li>

      <li>
        <p><u>Cancellation</u></p>

        In the event of cancellation any Rent paid shall be returned in full.
      </li>

      <li>
        <p><u>Parking</u></p>

        The Lessee and its guests shall park in the driveway or on-street
        without blocking other residences' ingress & egress. No vehicles shall
        be parked on the lawn. The Lessee and its guests bear full
        responsibility for all vehicles and the contents of said vehicles.
      </li>

      <li>
        <p><u>Restrictions</u></p>

        <ol type="a">
          <li>
            Nothing may be pinned, nailed or stapled to any wall, door, ceiling
            or floor. Adhesion with masking tape or similar materials that leave
            permanent markings or discoloration are permissible.
          </li>
          <li>
            Smoking is NOT permitted anywhere on the Property at any time unless
            expressly agreed to by both parties in writing.
          </li>
          <li>
            The Lessee shall ensure that Property (including, but not limited to
            detritus & garbage being properly bagged, dishes & utensils being
            cleaned, etc.) shall be left in the same condition that existed at
            the beginning of rental of the Property.
          </li>
          <li>
            Lessee acknowledges that the Property is located near residential
            and commercial areas and therefore agrees to control the noise level
            at the Event such that it does not disturb neighboring occupants. In
            the event that Lessee's Event creates a disturbance due to high
            noise volume, Lessee shall immediately reduce the volume. If
            repeated disturbances are created, at Lessor's discretion, Lessee
            may be expelled from the Property or the offending noise ended by
            the Lessor. In the event of disturbances to the point of expulsion,
            no portion of the Rent shall be refunded.
          </li>
        </ol>
      </li>

      <li>
        <p><u>Changes to This Agreement</u></p>

        All changes, additions, and deletions shall not be considered agreed to
        or binding to the other unless such modifications have been initiated or
        otherwise approved in writing by both parties to this Agreement.
      </li>

      <li>
        <p><u>Acceptance</u></p>

        This Agreement will constitute a binding contract between the parties.
        The individuals signing below represent that each is Listed to bind his
        or her party to this Agreement.
      </li>

      <li>
        <p><u>Jurisdiction</u></p>

        The laws of ${rentalAddress?.state} shall govern
        this Agreement.
      </li>
    </ol>

    <p>I have read and agree to the policies and procedures attached.</p>

    <div style="margin-top: 80px">
      <p>
        <strong 
            class="border-bottom"
            style="display: inline-block; min-width: 250px"
        > ${businessAddress?.business_name} </strong>
      </p>
      <p>Lessee Printed Name & Title</p>
    </div>
    <div style="margin-top: 40px">
      <p>
        <div style="max-width: 176px; height: auto; position: relative; ">
            <img  
            width="100%" 
            height="100%" 
            style="width: 150px; display: block; position: absolute; height: auto; top: -32px;" 
            src="${lessee_signature}" alt="">
          </div>
        <span
          class="border-bottom"
          style="display: inline-block; min-width: 250px"
        ></span>
      </p>
      <p>Lessee Signature</p>
    </div>

    <div style="margin-top: 40px">
      <p>
        <span
          class="border-bottom"
          style="display: inline-block; min-width: 250px"
        >
          <span>${new Date().toLocaleDateString()}</span>
        </span>
      </p>
      <p>Lessee Sign Date</p>
    </div>

    <div style="margin-top: 40px">
      <p>
        <strong>
          <span
            class="border-bottom"
            style="display: inline-block; min-width: 250px"
          >
            ${user_name}
          </span>
        </strong>
      </p>
      <p>Lessor Printed Name & Title</p>
    </div>

    <div style="margin-top: 40px">
      <p>
        <div style="max-width: 176px; height: auto; position: relative; ">
            <img  
            width="100%" 
            height="100%" 
            style="width: 150px; display: block; position: absolute; height: auto; top: -32px;" 
            src="${lessor_signature}" alt="">
          </div>
        <span
          class="border-bottom"
          style="display: inline-block; min-width: 250px"
        ></span>
      </p>
      <p>Lessor Signature</p>
    </div>
    <div style="margin-top: 40px">
      <p>
        <span
          class="border-bottom"
          style="display: inline-block; min-width: 250px"
        >
        <span>${new Date().toLocaleDateString()}</span>
        </span>
      </p>
      <p>Lessor Sign Date</p>
    </div>
  </body>
</html>
`;
};

export { rentalAgreementToHtml, signedRentalAgreementToHtml };
