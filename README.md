# 🌱 PlantPulse — Edge-Based Soil Health Monitoring & Remote Irrigation System

*A table-top plant care system that senses, thinks, and waters — powered by edge AI running directly on an ESP32.*
<img width="1131" height="1600" alt="image" src="https://github.com/user-attachments/assets/03d4262b-efbd-434e-ad18-b0b2f1b8c276" />

---

## Overview

Keeping a table-top plant alive sounds simple, but getting the watering right consistently is surprisingly hard. **PlantPulse** is an IoT and edge-AI system that takes the guesswork out of indoor plant care. A compact sensor node continuously measures soil moisture, nutrient levels (NPK), ambient temperature, and light intensity, then feeds that data into two neural networks running **directly on an ESP32 microcontroller** — one that decides whether the plant needs watering, and another that classifies its overall health.

When irrigation is required, a relay-controlled pump waters the plant automatically, while a companion web and mobile dashboard lets users check in on their plants and step in manually whenever they'd like. By pushing the intelligence to the edge instead of the cloud, the system keeps working — and keeps the plant alive — even without a live internet connection.

## Problem Statement

Indoor table-top plants grown in homes, offices, and hostels need consistent monitoring of soil moisture, nutrient levels, and temperature to stay healthy, since these factors directly govern how well a plant absorbs water and nutrients.

In practice, most indoor plant care still relies on fixed watering schedules or rough visual guesswork rather than the plant's actual, real-time needs. This routinely leads to:

- Over-irrigation or under-watering
- Nutrient imbalance
- Water stress
- Wasted water and inefficient resource use

There is currently no compact, intelligent system that combines soil monitoring with automated irrigation for small indoor plants — which is exactly the gap this project sets out to close with a data-driven, IoT-based solution.


##  Proposed Solution

To close these gaps, this project implements an **IoT-based soil health monitoring and smart irrigation system** purpose-built for table-top indoor plants.

The system continuously tracks:
- Soil moisture
- Soil nutrient levels (NPK)
- Ambient temperature
- Light intensity

All sensor data is processed **locally** by machine learning models running on the ESP32 microcontroller. Based on real-time soil conditions, the system evaluates the plant's status and automatically determines whether irrigation is needed, activating a relay-controlled pump only when watering is actually required to help prevent overwatering.

## System Architecture

The system is organized into four cooperating layers — sensing, processing, actuation, and cloud — so that time-critical decisions, like whether to water the plant right now, never have to wait on a network round-trip.
<img width="1342" height="840" alt="image" src="https://github.com/user-attachments/assets/108e71ac-3a54-4fda-901d-da97e4b0ccb6" />

##  Hardware Components

| Component | Role | Interface |
|---|---|---|
| **ESP32** | Central microcontroller; runs on-device ML inference | — |
| **DHT22** | Ambient temperature & humidity sensing | Single-wire |
| **BH1750** | Ambient light intensity sensing | I2C |
| **Soil Moisture Sensor** | Soil moisture sensing | Analog |
| **NPK Sensor** | Soil nitrogen, phosphorus & potassium sensing | Modbus RTU |
| **HC-SR04 Ultrasonic Sensor** | Water reservoir level detection | Digital |
| **Relay Module** | Switches the pump and grow light | Digital |
| **Water Pump** | Delivers controlled irrigation | Relay-actuated |
| **LED Grow Light** | Supplemental plant lighting | Relay-actuated |
| **9V Battery / Power Adapter** | System power supply | — |

## Iot Integration (Device and Component Integration)
<img width="3000" height="1885" alt="image" src="https://github.com/user-attachments/assets/fa6cfd83-38c0-4819-a22b-d711d0e8684b" />

<p align="center">
  <img src="https://github.com/user-attachments/assets/44846497-74cb-4aa5-a0e9-12cdc216e22e" width="48%" />
  <img src="https://github.com/user-attachments/assets/e618bbb9-8a7e-459d-814f-48472202c371" width="48%" />
</p>

##  Edge Deployment (On-Device Inference)

Rather than sending sensor data to the cloud for every decision, both models are deployed directly onto the ESP32:

1. **Train** — Models are built and trained using TensorFlow/Keras.
2. **Convert** — Trained models are converted to TensorFlow Lite (Float32) format, optimized for embedded execution.
3. **Deploy** — The `.tflite` models are stored in the ESP32's onboard memory.
4. **Infer** — Sensor readings are fed directly into the TFLite interpreter, producing predictions in real time with no network call.


##  Tech Stack

| Category | Technology |
|---|---|
| Microcontroller | ESP32 |
| On-Device ML | TensorFlow / Keras → TensorFlow Lite (Float32) |
| Communication Protocols | I2C, Single-Wire, Modbus RTU, Analog, MQTT, RPC |
| IoT Dashboard | ThingsBoard |
| Backend API | FastAPI |
| Database & Auth | Supabase (PostgreSQL, Row Level Security) |
| Circuit Design | Cirkit Designer |
| Frontend | React |

## Screenshots & Demo
### Prototype:
<img width="1280" height="1000" alt="image" src="https://github.com/user-attachments/assets/55b0e9de-6231-4965-b63c-0f990e82d4b3" />


