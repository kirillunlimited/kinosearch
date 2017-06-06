'use strict';
module.exports = function MovieController(jsonService, photoService, dateService, $state, $sce, $rootScope) {
  var vm = this;

  vm.movieStatus = 'Loading';

  var fetchParams = {
    id:$state.params.id
  };

  var getMovieParams = function(movieObject) {
    var paramKeys = [
      'production_countries',
      'runtime',
      'release_date',
      'status',
      'budget',
      'revenue'
    ];

    movieObject.release_date = jsonService.formatDate(movieObject.release_date);
    movieObject.runtime      = jsonService.formatRuntime(movieObject.runtime);
    movieObject.budget       = jsonService.formatMoney(movieObject.budget);
    movieObject.revenue      = jsonService.formatMoney(movieObject.revenue);

    // make array (not object) to keep own order
    // [0] - key, [1] - value
    return paramKeys.map(function(element) {
      return [element,movieObject[element]];
    });

  };

  jsonService.fetch('movie', fetchParams).then(function(response) {
    vm.movie = response.data;
    vm.movieParams = getMovieParams(jsonService.cloneObject(vm.movie));
    vm.movieStatus = 'Ready';

    $rootScope.pageTitle = vm.movie.title;
  });

  var getCredits = function(creditsObject) {
    var crewKeys = [
      'Director',
      'Producer',
      'Screenplay',
      'Story'
    ];

    // // make array (not object) to keep own order
    // // [0] - key, [1] - value
    return crewKeys.map(function(element) {
      return getCreditsByJob(element, creditsObject);
    });

  };

  var getCreditsByJob = function(job, creditsObject) {
    var crewObject = [];
    crewObject[0] = job;
    crewObject[1] = [];

    creditsObject.crew.forEach(function(person){
      if (person.job == job) {
        crewObject[1].push({
          id: person.id,
          name: person.name
        })
      }
    });
    return crewObject;
  };

  jsonService.fetch('movieCredits', fetchParams).then(function(response) {
    vm.credits = response.data;
    vm.crew = getCredits(jsonService.cloneObject(vm.credits));
  });

  var galleryFetchParams = {
    id:$state.params.id,
    getParams: {
      include_image_language: 'null'
    }
  };

  jsonService.fetch('movieGallery', galleryFetchParams).then(function(response){
    vm.movieGalleryContent = response.data;
    vm.gallery = photoService.getMovieGallery(vm.movieGalleryContent.backdrops.slice(0,6));
  });

  function getTrailer(videoObjects) {
    for (var i in videoObjects) {
      if (videoObjects[i].site == 'YouTube' && videoObjects[i].type == 'Trailer') {
        return $sce.trustAsResourceUrl('//www.youtube.com/embed/' + videoObjects[i].key);
      }
    }
  };

  // TODO: move to service
  function getVideos(videoObjects) {
    return videoObjects
      .map(function(element) {
        if (element.site == 'YouTube' && element.type == 'Trailer') {
          return $sce.trustAsResourceUrl('//www.youtube.com/embed/' + element.key);
        }
        else {
          return null;
        }
      }).filter(function(element) {
        return element; // return not null elements
      });
  };

  jsonService.fetch('movieVideos', fetchParams).then(function(response){
    vm.videosContent = response.data;
    if (vm.videosContent.results) {
      vm.videos = getVideos(vm.videosContent.results);
      vm.trailer = getTrailer(vm.videosContent.results);
    }
  });

};