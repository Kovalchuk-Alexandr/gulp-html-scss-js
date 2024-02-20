const gulp = require('gulp');
const fileInclude = require('gulp-file-include');
const sass = require('gulp-sass')(require('sass'));
const server = require('gulp-server-livereload');
const clean = require('gulp-clean');
const fs = require('fs');   // Работа с файловой системой
const sourceMaps = require('gulp-sourcemaps'); // Позволяет видеть в инспекторе в каком исходнике код

// Необязательные, но полезные
// Группировка медиа-запросов в одно место, но ломает исходные карты
// const groupMedia = require('gulp-group-css-media-queries');

// При возникновении ошибки, чтобы избежать зависания - 'plumber'
// 'notify' - выводит сообщения средствамии ОС
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');

// Tasks
// require('./gulp/dev.js');
// require('./gulp/docs.js');

// Таск для очистки/удаления 'dist'
gulp.task('clean', function (done) {
    // Если 'dist' отсутствует, а мы попытаемся запустить таск, то выдаст ошибку
    // потому делаем проверку на наличие
    if (fs.existsSync('./dist')) {
        // чтобы не читать файлы (таск отработает быстрее), можно добавить
        // return gulp.src('./dist/', {read: false})
        return gulp.src('./dist/')
            .pipe(clean());
            // .pipe(clean({force: true})); - Принудительное удаление файлов, если система не позволяет
    }
    done();
})

// Нотификатор для HTML
const plumberHtmlConfig = {
    errorHandler: notify.onError({
        title: 'HTML',
        message: 'Error <%= error.message %>',
        sound: false
    })
}

// Таск для компиляции html
const fileIncludeSetttings = {
    prefix: "@@",
    basepath: "@file",
};

gulp.task('html', function () {
	return gulp
        .src("./src/*.html")
        .pipe(plumber(plumberHtmlConfig))
        .pipe(fileInclude(fileIncludeSetttings))
        .pipe(gulp.dest("./dist/"));
})

// Нотификатор для стилей
const plumberSassConfig = {
    errorHandler: notify.onError({
        title: 'Styles',
        message: 'Error <%= error.message %>',
        sound: false
    })
}

// Таск для компиляции scss
gulp.task('sass', function () {
    return gulp
        .src("./src/scss/*.scss")
        .pipe(plumber(plumberSassConfig))
        .pipe(sourceMaps.init()) // инициализируем sourceMaps
        .pipe(sass())
        // .pipe(groupMedia()) //Запускать при финишной сборке, ломает sourceMap
        .pipe(sourceMaps.write()) // записываем sourceMaps
        .pipe(gulp.dest("./dist/css/"));
})

// Таск для копирования изображений
gulp.task('imgs', function () {
    return gulp.src('./src/img/**/*')
        .pipe(gulp.dest('./dist/img/'))
})

// Таск для копирования фонтов
gulp.task('fonts', function () {
    return gulp.src('./src/fonts/**/*')
        .pipe(gulp.dest('./dist/fonts/'))
})

// Таск для копирования разных файлов (например pdf)
gulp.task('files', function () {
    return gulp.src("./src/files/**/*").pipe(gulp.dest("./dist/files/"));
})



// Таск для сервера
const serverOptions = {
    livereload: true,
    open: true,
};

// С выделением опций в переменную
gulp.task("server", function () {
    return gulp.src("./dist/").pipe(
        server(serverOptions)
);

    // Таск для сервера. Вариант "Все в одном"
    // gulp.task('startServer', function () {
    //     return gulp.src('./dist/').pipe(server({
    //         livereload: true,
    //         open: true
    //     }))
});

// Слежение и пересборка при необходимости
gulp.task('watch', function () {
    gulp.watch('./src/scss/**/*.scss', gulp.parallel('sass'));
    gulp.watch('./src/**/*.html', gulp.parallel('html'));
    gulp.watch("./src/img/**/*", gulp.parallel("imgs"));
    gulp.watch("./src/fonts/**/*", gulp.parallel("fonts"));
    gulp.watch("./src/files/**/*", gulp.parallel("files"));

})
 
// Дефолтный таск, запускает всю сборку
gulp.task('default',
    gulp.series('clean',
    gulp.parallel('html', 'sass', 'imgs', 'fonts', 'files'),
    gulp.parallel('server', 'watch')
));

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
