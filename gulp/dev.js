// Рабочая (dev) сборка
const gulp = require("gulp");
const fileInclude = require("gulp-file-include");
const sass = require("gulp-sass")(require("sass"));
const sassGlob = require("gulp-sass-glob");
const server = require("gulp-server-livereload");
const clean = require("gulp-clean");
const fs = require("fs"); // Работа с файловой системой
const sourceMaps = require("gulp-sourcemaps"); // Позволяет видеть в инспекторе в каком исходнике код

// Необязательные, но полезные
// Группировка медиа-запросов в одно место, но ломает исходные карты
// const groupMedia = require('gulp-group-css-media-queries');

// При возникновении ошибки, чтобы избежать зависания - 'plumber'
// 'notify' - выводит сообщения средствамии ОС
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");

// Подключение webpack
const webpack = require("webpack-stream");

// Подключение 'babel' - поддержка старых браузеров
const babel = require("gulp-babel");

// Минимизация изображений
const imagemin = require("gulp-imagemin");

// Пакет обработки только тех файлов, которые изменялись
const changed = require("gulp-changed");

// ===========  Таски  =============================

// Таск для очистки/удаления 'dist' (заменили рабочую папку на '/build')
// чтобы не путать таски с 'dist', к рабочим добавляем постфикс ':dev'
gulp.task("clean:dev", function (done) {
    // Если 'dist' отсутствует, а мы попытаемся запустить таск, то выдаст ошибку
    // потому делаем проверку на наличие
    if (fs.existsSync("./build")) {
        // чтобы не читать файлы (таск отработает быстрее), можно добавить
        // return gulp.src('./dist/', {read: false})
        return gulp.src("./build/").pipe(clean());
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

gulp.task("html:dev", function () {
    // "!./src/html/blocks/*.html" - исключаем папку из конечного 'dist'
    // {hasChanged: changed.compareContents} - отслеживает изменения подключаемых пакетов
    return gulp
        .src(["./src/html/**/*.html", "!./src/html/blocks/*.html"])
        .pipe(changed("./build/", { hasChanged: changed.compareContents }))
        .pipe(plumber(plumberNotify("HTML")))
        .pipe(fileInclude(fileIncludeSetttings))
        .pipe(gulp.dest("./build/"));
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
gulp.task("sass:dev", function () {
    return (
        gulp
            .src("./src/scss/*.scss")
            .pipe(changed("./build/css/"))
            .pipe(plumber(plumberNotify("SCSS")))
            .pipe(sourceMaps.init()) // инициализируем sourceMaps
            .pipe(sassGlob()) //Собирает в один файл
            .pipe(sass())
            // .pipe(groupMedia()) //Запускать при финишной сборке, ломает sourceMap
            .pipe(sourceMaps.write()) // записываем sourceMaps
            .pipe(gulp.dest("./build/css/"))
    );
});

// Таск для копирования изображений
gulp.task("imgs:dev", function () {
    return gulp
        .src("./src/img/**/*")
        .pipe(changed("./build/img/"))
        .pipe(imagemin({ verbose: true })) //показывает в консоли, какие файлы были оптимизированы и сколько места сохранено
        .pipe(gulp.dest("./build/img/"));
});

// Таск для копирования фонтов
gulp.task("fonts:dev", function () {
    return gulp
        .src("./src/fonts/**/*")
        .pipe(changed("./build/fonts/"))
        .pipe(gulp.dest("./build/fonts/"));
});

// Таск для копирования разных файлов (например pdf)
gulp.task("files:dev", function () {
    return gulp
        .src("./src/files/**/*")
        .pipe(changed("./build/files/"))
        .pipe(gulp.dest("./build/files/"));
});

// Таск для JS (webpack)
gulp.task("js:dev", function () {
    return (
        gulp
            .src("./src/js/*.js")
            .pipe(changed("./build/js/"))
            .pipe(plumber(plumberNotify("JS")))
            // .pipe(babel())       //Отключаем на этапе разработки, включим в продакшн
            .pipe(webpack(require("./../webpack.config.js")))
            .pipe(gulp.dest("./build/js"))
    );
});

// Таск для сервера
const serverOptions = {
    livereload: true,
    open: true,
};

// С выделением опций в переменную
gulp.task("server:dev", function () {
    return gulp.src("./build/").pipe(server(serverOptions));

    // Таск для сервера. Вариант "Все в одном"
    // gulp.task('startServer', function () {
    //     return gulp.src('./build/').pipe(server({
    //         livereload: true,
    //         open: true
    //     }))
});

// Слежение и пересборка при необходимости
gulp.task("watch:dev", function () {
    gulp.watch("./src/scss/**/*.scss", gulp.parallel("sass:dev"));
    gulp.watch("./src/**/*.html", gulp.parallel("html:dev"));
    gulp.watch("./src/img/**/*", gulp.parallel("imgs:dev"));
    gulp.watch("./src/fonts/**/*", gulp.parallel("fonts:dev"));
    gulp.watch("./src/files/**/*", gulp.parallel("files:dev"));
    gulp.watch("./src/js/**/*.js", gulp.parallel("js:dev"));
});

// Дефолтный таск, запускает всю сборку
// Перенесли в 'gulp/dev.js'
// gulp.task(
//     "default",
//     gulp.series(
//         "clean",
//         gulp.parallel("html", "sass", "imgs", "fonts", "files", "js"),
//         gulp.parallel("server", "watch")
//     )
// );

// Тестовый таск
// gulp.task('hello', function (done) {
// 	console.log('Hello from Gulp');
// 	done();
// });

// gulp.task('default', gulp.series('hello'));

// gulp.task(
// 	'default',
// 	gulp.series(
// 		'clean:dev',
// 		gulp.parallel('html:dev', 'sass:dev', 'images:dev', 'fonts:dev', 'files:dev', 'js:dev'),
// 		gulp.parallel('server:dev', 'watch:dev')
// 	)
// );

// gulp.task(
// 	'docs',
// 	gulp.series(
// 		'clean:docs',
// 		gulp.parallel('html:docs', 'sass:docs', 'images:docs', 'fonts:docs', 'files:docs', 'js:docs'),
// 		gulp.parallel('server:docs')
// 	)
// );
