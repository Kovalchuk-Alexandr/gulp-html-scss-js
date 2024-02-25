// Production (docs) сборка
const gulp = require("gulp");

// HTML
const fileInclude = require("gulp-file-include");
const htmlclean = require('gulp-htmlclean');
const webpHTML = require("gulp-webp-html");

// SASS
const sass = require("gulp-sass")(require("sass"));
const sassGlob = require("gulp-sass-glob");
const autoprefixer = require("gulp-autoprefixer");
const csso = require("gulp-csso");
const webpCss = require("gulp-webp-css");

const server = require("gulp-server-livereload");
const clean = require("gulp-clean");
const fs = require("fs"); // Работа с файловой системой
const sourceMaps = require("gulp-sourcemaps"); // Позволяет видеть в инспекторе в каком исходнике код

// Необязательные, но полезные
// Группировка медиа-запросов в одно место, но ломает исходные карты
const groupMedia = require("gulp-group-css-media-queries");

// При возникновении ошибки, чтобы избежать зависания - 'plumber'
// 'notify' - выводит сообщения средствамии ОС
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");

// Подключение webpack
const webpack = require("webpack-stream");

// Подключение 'babel' - поддержка старых браузеров
const babel = require("gulp-babel");

// Минимизация/оптимизация изображений
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");


// Пакет обработки только тех файлов, которые изменялись
const changed = require("gulp-changed");

// ===========  Таски  =============================

// Таск для очистки/удаления 'dist' (заменили рабочую папку на '/build')
// чтобы не путать таски с 'dist', к рабочим добавляем постфикс ':dev', production - ':docs'
gulp.task("clean:docs", function (done) {
    // Если 'dist' отсутствует, а мы попытаемся запустить таск, то выдаст ошибку
    // потому делаем проверку на наличие
    if (fs.existsSync("./docs")) {
        // чтобы не читать файлы (таск отработает быстрее), можно добавить
        // return gulp.src('./dist/', {read: false})
        return gulp.src("./docs/").pipe(clean());
        // .pipe(clean({force: true})); - Принудительное удаление файлов, если система не позволяет
    }
    done();
});

// Функция-нотификатор, заменяющая общую часть для 'HTML' & 'SASS'
const plumberNotify = (title) => {
    return {
        errorHandler: notify.onError({
            title: title,
            message: "Error <%= error.message %>",
            sound: false,
        }),
    };
};

// Нотификатор для HTML (Заменили функцие. см. выше)
// const plumberHtmlConfig = {
//     errorHandler: notify.onError({
//         title: 'HTML',
//         message: 'Error <%= error.message %>',
//         sound: false
//     })
// }

// Таск для компиляции html
const fileIncludeSetttings = {
    prefix: "@@",
    basepath: "@file",
};

gulp.task("html:docs", function () {
    // "!./src/html/blocks/*.html" - исключаем папку из конечного 'dist'
    return gulp
        .src(["./src/html/**/*.html", "!./src/html/blocks/*.html"])
        .pipe(changed("./docs/"))
        .pipe(plumber(plumberNotify("HTML")))
        .pipe(fileInclude(fileIncludeSetttings))
        .pipe(webpHTML())
        .pipe(htmlclean()) // минификатор HTML
        .pipe(gulp.dest("./docs/"));
});

// Нотификатор для стилей (Заменили функцие. см. выше)
// const plumberSassConfig = {
//     errorHandler: notify.onError({
//         title: 'Styles',
//         message: 'Error <%= error.message %>',
//         sound: false
//     })
// }

// Таск для компиляции scss
gulp.task("sass:docs", function () {
    return gulp
        .src("./src/scss/*.scss")
        .pipe(changed("./docs/css/"))
        .pipe(plumber(plumberNotify("SCSS")))
        .pipe(sourceMaps.init()) // инициализируем sourceMaps
        .pipe(autoprefixer())
        .pipe(sassGlob()) //Собирает в один файл
        .pipe(webpCss()) // or .pipe(webpCss(['.jpg','.jpeg']))
        .pipe(groupMedia()) //Запускать при финишной сборке, ломает sourceMap
        .pipe(sass())
        .pipe(csso())
        .pipe(sourceMaps.write()) // записываем sourceMaps
        .pipe(gulp.dest("./docs/css/"));
});

gulp.task("csso", function () {
    return gulp.src("./docs/css/*.css").pipe(csso()).pipe(gulp.dest("./docs/css/out"));
});

// Таск для копирования изображений
gulp.task("imgs:docs", function () {
    return gulp
        .src("./src/img/**/*")
        .pipe(changed("./docs/img/"))
        .pipe(webp())
        .pipe(gulp.dest("./docs/img/"))
        .pipe(gulp.src("./src/img/**/*"))
        .pipe(changed("./docs/img/"))
        .pipe(imagemin({ verbose: true })) //показывает в консоли, какие файлы были оптимизированы и сколько места сохранено
        .pipe(gulp.dest("./docs/img/"));
});

// Таск для копирования фонтов
gulp.task("fonts:docs", function () {
    return gulp
        .src("./src/fonts/**/*")
        .pipe(changed("./docs/fonts/"))
        .pipe(gulp.dest("./docs/fonts/"));
});

// Таск для копирования разных файлов (например pdf)
gulp.task("files:docs", function () {
    return gulp
        .src("./src/files/**/*")
        .pipe(changed("./docs/files/"))
        .pipe(gulp.dest("./docs/files/"));
});

// Таск для JS (webpack)
gulp.task("js:docs", function () {
    return gulp
        .src("./src/js/*.js")
        .pipe(changed("./docs/js/"))
        .pipe(plumber(plumberNotify("JS")))
        .pipe(babel())
        .pipe(webpack(require("../webpack.config.js")))
        .pipe(gulp.dest("./docs/js"));
});

// Таск для сервера
const serverOptions = {
    livereload: true,
    open: true,
};

// С выделением опций в переменную
gulp.task("server:docs", function () {
    return gulp.src("./docs/").pipe(server(serverOptions));
});

// Слежение и пересборка при необходимости. 
// В конечной сборке нет необходимости включать
// gulp.task("watch:docs", function () {
//     gulp.watch("./src/scss/**/*.scss", gulp.parallel("sass:docs"));
//     gulp.watch("./src/**/*.html", gulp.parallel("html:docs"));
//     gulp.watch("./src/img/**/*", gulp.parallel("imgs:docs"));
//     gulp.watch("./src/fonts/**/*", gulp.parallel("fonts:docs"));
//     gulp.watch("./src/files/**/*", gulp.parallel("files:docs"));
//     gulp.watch("./src/js/**/*.js", gulp.parallel("js:docs"));
// });
