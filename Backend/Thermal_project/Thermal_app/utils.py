from django.http import HttpResponse
from django.core.mail import send_mail
from datetime import datetime, timedelta
import pyotp
import json
from PIL import Image
from PIL.ExifTags import TAGS


def send_otp(request):
    """
    This function sends a One Time Password (OTP) to a specified email address using Django's send_mail function.
    It generates a TOTP (Time-based One-Time Password) using the pyotp library, and sends the OTP along with a validity period.

    Parameters:
    request (HttpRequest): The incoming request object containing the email address to which the OTP will be sent.

    Returns:
    tuple: A tuple containing the TOTP secret key and the expiration date of the OTP in string format.
    """
    totp = pyotp.TOTP(pyotp.random_base32(), interval=300)
    otp = totp.now()
    valid_date = datetime.now() + timedelta(minutes=5)
    # data = json.loads(request.body)
    recipient = request.data.get("email")

    send_mail(
        subject="Verify your OTP",
        message=f"Hey, Your One Time Password is {otp}. The OTP is valid for 5 minutes.",
        from_email='notify@indavian.com',
        recipient_list=[recipient],
        fail_silently=False
    )
    print("The OTP is:", otp)

    return totp.secret, str(valid_date)


def get_geolocation(image):
    """
    This function retrieves the geographical location (latitude and longitude) from an image file using its EXIF data.

    Parameters:
    image (str or file-like object): The image file from which to extract the geolocation.

    Returns:
    str: A string representing the geographical location in the format "latitude, longitude".
    """
    img = Image.open(image)
    exif_data = img.getexif()

    def decimal_coords(coords, ref):
        decimal_degrees = f"{coords[0]}° {coords[1]}' {coords[2]}\" {ref}"
        return decimal_degrees

    GPSINFO_TAG = next(tag for tag, name in TAGS.items() if name == "GPSInfo")

    gpsinfo = exif_data.get_ifd(GPSINFO_TAG)
    return f"{decimal_coords(gpsinfo[2], gpsinfo[1])}, {decimal_coords(gpsinfo[4], gpsinfo[3])}"
