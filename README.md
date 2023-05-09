## AWS IoT ExpressLink Plant Reference

The plant demo will demonstrate how to integrate various AWS cloud features with ExpressLink. The plant demo uses several peripherals to monitor the environment of a plant and notify a user when certain variables are outside of the desired state for the plant.

<br>
<center><img src="docs/architectureDiagram.png" alt="alt text"/></center>
</br>

## Repository structure 

The repository is separated into 2 folders: cdk and arduino. The arduino folder contains the code that needs to be flashed onto the host board. The cdk folder contains the CDK template for creating and deploying the cloud resources for the demo.

## Hardware Setup

The demo is built on a P-NUCLEO-WB55 by STMicroelectionics; running the example on a different host board may require some modification to the serial communication and peripheral connections. The demo uses four sensors (photocell, temperature sensor, soil moisture sensor, and water level sensor) to monitor the plant's environment. In addition to these sensors the demo also includes a water pump for automatically watering the plant on a schedule.

## ExpressLink Documentation

* [AWS IoT ExpressLink Programmer's Guide](https://docs.aws.amazon.com/iot-expresslink/latest/programmersguide/elpg.html)
* [AWS IoT ExpressLink Getting Started Guide](https://docs.aws.amazon.com/iot-expresslink/latest/gettingstartedguide/elgsg.html)
* [AWS IoT ExpressLink Onboarding-by-Claim Customer/OEM Guide](https://docs.aws.amazon.com/iot-expresslink/latest/oemonboardingguide/oemog.html)
* [More AWS IoT ExpressLink Examples](https://github.com/aws/iot-expresslink)

## YouTube Videos

* [Playlist: Building a Weather Station](https://www.youtube.com/watch?v=hGBIzlp68bU&list=PLhr1KZpdzukdy_S7NpE9kkC75SXUCMYdO)
* [Espressif's AWS IoT ExpressLink Solution](https://www.youtube.com/watch?v=NSGCVH0OU7w)
* [u-blox AWS IoT ExpressLink](https://www.youtube.com/watch?v=4GiBnT0I0HE)
* [AWS IoT ExpressLink and the u-blox NORA-W2](https://www.youtube.com/watch?v=PvyzQwVgCCw)
* [Product Showcase: AWS IoT ExpressLink SARA-R5 Starter Kit](https://www.youtube.com/watch?v=nJNYUP0413c)
* [AIROC™ Cloud Connectivity Manager module & AWS IoT ExpressLink](https://www.youtube.com/watch?v=LEGDyNXPYfc)
* [Innovation Coffee with AWS IoT ExpressLink](https://www.youtube.com/watch?v=K0saFj-6s6c)

## License

The resources in this repository are licensed under the MIT-0 License. See the LICENSE file.