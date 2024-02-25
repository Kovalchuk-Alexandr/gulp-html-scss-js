import hello from './hello'

// Инициализация datapicker - календарь
import AirDatepicker from "air-datepicker";
import "air-datepicker/air-datepicker.css";

document.addEventListener("DOMContentLoaded", () => {
    new AirDatepicker("#date");
});

console.log(hello);
