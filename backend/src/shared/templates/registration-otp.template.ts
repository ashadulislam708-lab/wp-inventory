export const getRegistrationOtpEmailTemplate = (otp: number): string => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Parking Go!</h2>
            <p>Please verify your email address by using the following OTP:</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 8px; margin: 20px 0;">
                ${otp}
            </div>
            <p style="color: #666; font-size: 14px;">This OTP is valid for 2 minutes. If you did not sign up, please ignore this email.</p>
        </div>
    `;
};
