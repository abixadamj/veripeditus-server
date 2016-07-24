/*
 * Copyright (C) 2016  Dominik George <nik@naturalnet.de>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Alternatively, you are free to use this software under any of
 * LGPL-2+, AGPL-3+, Simplified BSD or The MirOS Licence.
 */

/*
 * This service provides very basic authentication functionality by
 * using nothing more than HTTP Basic Auth. It makes some assumptions:
 *
 *  1. All HTTP requests go to the same endpoint or, at least, endpints
 *     expecting the same credentials.
 *  2. Endpoints reliably return a status of 401 iff a request needs
 *     authentication or the provided credentials could not be verified.
 *  3. There is an ngRoute matching /login that this service redirects
 *     to when it receives a 401 status.
 *
 * We deliberately decided to not use OAUth, any other token-based or
 * session based authentication or anything else. The strategy of this
 * authentication method is a radicalisation of RESTful combined with
 * the KISS principle - HTTP Basic Auth is well-known, a mature
 * standard, enough to authenticate a client and does not need any other
 * state maintenance on the server or the client.
 *
 * To use the service, all you need to do is create a view, routed to
 * from /login, that, after collecting credentials from the user, calls
 * APIBasicAuth.login(username, password, remember). If remember is
 * truthy, the authentication string will be stored in localStorage and
 * retrieved on instantiation of the service. If not, it will be stored
 * in sessionStorage in order to survive page reloads. Also, add the
 * interceptor like this:
 *
 *  $httpProvider.interceptors.push('APILoginInterceptor');
 *
 * To get rid of the stored credentials, call APIBasicAuth.logout().
 *
 * The service also extracts an object called server_info from JSON
 * replies to any HTTP request. The idea is that every REST response
 * conveys information about the server. This removes the need for
 * separate retrieval of that information and allows the application to
 * react to any changes immediately (like API version on updates, easing
 * live migrations).
 *
 * If this server_info object contains an object named user, then this
 * is taken to represent the user authenticated through HTTP Basic auth
 * and is used by the service to determine successful login.
 *
 * The Messages service is used to add floating messages on login,
 * logout or error (optionally, if it is available).
 */

angular.module('ngBasicAuth', []).factory('APIBasicAuth', function($log, $window, $injector) {
    // Try to get Messages service
    var Messages;
    try {
        Messages = $injector.get('Messages');
    } catch(error) {
        $log.warn("APIBasicAuth: Messages service not available, adding stub.");

        // Add a stub making Messages calls no-op
        Messages = {
            add: function() {}
        }
    }

    var server_info = {};
    var data = {}

    // Look for auth string in session storage, then local storage
    var auth_string = $window.sessionStorage.auth_string || $window.localStorage.auth_string || "";
    if (auth_string) {
        data.auth_string = auth_string;
        $log.info("APIBasicAuth: Loaded known HTTP Basic Auth string");
    }

    return {
        login: function(username, password, remember) {
            // Encode HTTP basic auth string
            data.auth_string = "Basic " + window.btoa(username + ":" + password);

            // Store auth string in session storage
            $window.sessionStorage.auth_string = data.auth_string;
            // Also store in local persistent storage if desired
            if (remember) {
                $window.localStorage.auth_string = data.auth_string;
            }

            $log.log("APIBasicAuth: Stored new HTTP Basic Auth string");
        },
        logout: function() {
            // Add floating message
            Messages.add('info', 'You have been logged out.');

            // Unset and emove auth string from all storages
            delete data['auth_string'];
            delete $window.sessionStorage['auth_string'];
            delete $window.localStorage['auth_string'];

            $log.log("APIBasicAuth: Removed HTTP Basic Auth string");
        },
        loggedin: function() {
            return 'user' in this.server_info && 'id' in this.server_info.user;
        },
        server_info: server_info,
        data: data
    };
}).factory('APILoginInterceptor', function($q, $location, $rootScope, $log, $injector, APIBasicAuth) {
    // Try to get Messages service
    var Messages;
    try {
        Messages = $injector.get('Messages');
    } catch(error) {
        $log.warn("APIBasicAuth: Messages service not available, adding stub.");

        // Add a stub making Messages calls no-op
        Messages = {
            add: function() {},
            remove: function() {}
        }
    }

    return {
        request: function(request) {
            if ('auth_string' in APIBasicAuth.data) {
                request.headers.Authorization = APIBasicAuth.data.auth_string;
            }

            return request;
        },
        response: function(response) {
            if (typeof response.data === "object" && 'server_info' in response.data) {
                // Copy server info if it is inside the response
                // Doing this for every response that has it for live migrations on server-side
                var new_server_info = angular.copy(angular.fromJson(response.data).server_info);
            }

            // Did a user entry appear?
            if (new_server_info) {
                // Get old and new usernames
                var old_user = ('user' in APIBasicAuth.server_info) && ('username' in APIBasicAuth.server_info.user) ? APIBasicAuth.server_info.user.username : "";
                var new_user = ('user' in new_server_info) && ('username' in new_server_info.user) ? new_server_info.user.username : "";

                if (old_user != new_user && new_user != "") {
                    // Obviously we just logged in successfully
                    $log.info("APIBasicAuth: Successful login with HTTP Basic Auth string");
                    Messages.add('success', 'Login successful.');
                }

                // Store new server info
                APIBasicAuth.server_info = angular.copy(new_server_info);
            }

            // Return (possibly modified) response
            return response;
        },
        responseError: function(response) {
            if (response.status == 401) {
                $log.warn("APIBasicAuth: HTTP Basic Auth failed, redirecting to login");

                // Check if we were using authentication
                if ('auth_string' in APIBasicAuth.data) {
                    // If yes, tell user their credentials are wrong
                    Messages.add('danger', 'Login failed.');

                    // Log out to invalidate stored credentials
                    APIBasicAuth.logout();
                } else {
                    // If not, tell the user they need to log in now
                    Messages.add('info', 'You need to login for this to work.');
                }
                return $location.path("/login");
            }
            return $q.reject(response);
        }
    };
});
