module.exports = function(grunt) {
  grunt.initConfig({
    uglify: {
      amperka: {
        files: [{
          expand: true,
          cwd: 'modules/@amperka',
          src: ['*.js', '!*.min.js'],
          dest: 'modules/@amperka',
          ext: '.min.js'
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default', ['uglify']);
};
