window.HELP_IMPROVE_VIDEOJS = false;

// More Works Dropdown Functionality
function toggleMoreWorks() {
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        button.classList.add('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const container = document.querySelector('.more-works-container');
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (container && !container.contains(event.target)) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Close dropdown on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('moreWorksDropdown');
        const button = document.querySelector('.more-works-btn');
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('.copy-bibtex-btn');
    const copyText = button.querySelector('.copy-text');
    
    if (bibtexElement) {
        navigator.clipboard.writeText(bibtexElement.textContent).then(function() {
            // Success feedback
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bibtexElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        });
    }
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

// Video carousel autoplay when in view
function setupVideoCarouselAutoplay() {
    const carouselVideos = document.querySelectorAll('.results-carousel video');
    
    if (carouselVideos.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Video is in view, play it
                video.play().catch(e => {
                    // Autoplay failed, probably due to browser policy
                    console.log('Autoplay prevented:', e);
                });
            } else {
                // Video is out of view, pause it
                video.pause();
            }
        });
    }, {
        threshold: 0.5 // Trigger when 50% of the video is visible
    });
    
    carouselVideos.forEach(video => {
        observer.observe(video);
    });
}

const DEFAULT_PLOT_DATA_FILES = {
    cloud: 'data/web_cloud_MOR_dij_a0p900_b0p100_20260321_152739.json',
    trajectories: 'data/web_trajectories_MOR_dij_a0p900_b0p100_20260321_152739.json'
};

const PLOTLY_CONFIG = {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    toImageButtonOptions: {
        format: 'png',
        filename: 'planner_plot',
        scale: 2
    }
};

const COST_COLOR_SCALE = [
    [0.0, '#2456A6'],
    [0.5, '#1FA6B5'],
    [1.0, '#2BB673']
];

function setPlannerPlotsStatus(message, isError) {
    const status = document.getElementById('planner-plots-status');
    if (!status) return;

    status.textContent = message;
    if (isError) {
        status.classList.add('is-error');
    } else {
        status.classList.remove('is-error');
    }
}

function trajectoryByName(trajectories, name) {
    return trajectories.find(function(trajectory) {
        return trajectory && trajectory.name === name;
    }) || null;
}

function preferredPathTrajectory(trajectories) {
    return trajectoryByName(trajectories, 'path_replay') || trajectoryByName(trajectories, 'path_estimated');
}

function numeric(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

function buildCloudTrace(points, colorField, title, colorscale) {
    const x = [];
    const y = [];
    const z = [];
    const color = [];
    const normalizedField = colorField + '_norm';

    points.forEach(function(point) {
        const pointX = point && point.x;
        const pointY = point && point.y;
        const pointZ = point && point.z;
        const pointColor = point && (numeric(point[colorField]) ? point[colorField] : point[normalizedField]);

        if (numeric(pointX) && numeric(pointY) && numeric(pointZ) && numeric(pointColor)) {
            x.push(pointX);
            y.push(pointY);
            z.push(pointZ);
            color.push(pointColor);
        }
    });

    return {
        type: 'scatter3d',
        mode: 'markers',
        name: 'Samples',
        x: x,
        y: y,
        z: z,
        marker: {
            size: 4,
            opacity: 0.85,
            color: color,
            colorscale: colorscale,
            colorbar: {
                title: {
                    text: title
                }
            }
        },
        hovertemplate: 'x=%{x:.4f}<br>y=%{y:.4f}<br>z=%{z:.4f}<br>value=%{marker.color:.4f}<extra></extra>'
    };
}

function buildPathTraces(points) {
    const x = [];
    const y = [];
    const z = [];

    points.forEach(function(point) {
        if (numeric(point.x) && numeric(point.y) && numeric(point.z)) {
            x.push(point.x);
            y.push(point.y);
            z.push(point.z);
        }
    });

    if (x.length === 0) {
        return [];
    }

    const startIndex = 0;
    const endIndex = x.length - 1;

    return [
        {
            type: 'scatter3d',
            mode: 'lines',
            name: 'Path (replay)',
            x: x,
            y: y,
            z: z,
            line: {
                color: '#F28E2B',
                width: 6
            }
        },
        {
            type: 'scatter3d',
            mode: 'markers',
            name: 'Start',
            x: [x[startIndex]],
            y: [y[startIndex]],
            z: [z[startIndex]],
            marker: {
                color: '#1D4ED8',
                size: 7,
                symbol: 'square'
            }
        },
        {
            type: 'scatter3d',
            mode: 'markers',
            name: 'End',
            x: [x[endIndex]],
            y: [y[endIndex]],
            z: [z[endIndex]],
            marker: {
                color: '#DC2626',
                size: 7,
                symbol: 'square'
            }
        }
    ];
}

function buildCloudLayout(title) {
    return {
        title: {
            text: title
        },
        template: 'plotly_white',
        height: 440,
        margin: { l: 0, r: 0, b: 0, t: 40 },
        legend: {
            x: 0.02,
            y: 0.98,
            bgcolor: 'rgba(255,255,255,0.8)',
            bordercolor: '#e2e8f0',
            borderwidth: 1
        },
        scene: {
            xaxis: { title: 'X (m)', gridcolor: '#dbe2ea' },
            yaxis: { title: 'Y (m)', gridcolor: '#dbe2ea' },
            zaxis: { title: 'Z (m)', gridcolor: '#dbe2ea' },
            aspectmode: 'data'
        }
    };
}

function buildLineTraces(points, keys, colors) {
    return keys.map(function(key, index) {
        const x = [];
        const y = [];

        points.forEach(function(point) {
            if (!point) return;
            if (numeric(point.t) && numeric(point[key])) {
                x.push(point.t);
                y.push(point[key]);
            }
        });

        return {
            type: 'scatter',
            mode: 'lines',
            name: key,
            x: x,
            y: y,
            line: {
                width: 3,
                color: colors[index]
            }
        };
    });
}

function buildLineLayout(title, yLabel) {
    return {
        title: {
            text: title
        },
        template: 'plotly_white',
        height: 440,
        margin: { l: 55, r: 20, b: 55, t: 40 },
        xaxis: {
            title: 'Time [s]',
            gridcolor: '#dbe2ea'
        },
        yaxis: {
            title: yLabel,
            gridcolor: '#dbe2ea'
        },
        legend: {
            x: 0.02,
            y: 0.98,
            bgcolor: 'rgba(255,255,255,0.8)',
            bordercolor: '#e2e8f0',
            borderwidth: 1
        }
    };
}

async function fetchJson(path) {
    const pageUrl = new URL(window.location.href);
    var basePath = pageUrl.pathname;
    var lastSegment = basePath.substring(basePath.lastIndexOf('/') + 1);

    // Normalize base path so relative fetches still work with/without trailing slash.
    if (!basePath.endsWith('/')) {
        if (lastSegment.indexOf('.') !== -1) {
            basePath = basePath.substring(0, basePath.lastIndexOf('/') + 1);
        } else {
            basePath = basePath + '/';
        }
    }

    const baseUrl = pageUrl.origin + basePath;
    const resolvedPath = new URL(path, baseUrl).toString();
    const response = await fetch(resolvedPath, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error('Failed to fetch ' + resolvedPath + ' (' + response.status + ')');
    }
    return response.json();
}

async function resolvePlotDataSources() {
    try {
        const manifest = await fetchJson('data/manifest.json');
        if (manifest && manifest.cloud && manifest.trajectories) {
            return manifest;
        }
    } catch (error) {
        // Fallback to default filenames when manifest is not present.
    }
    return DEFAULT_PLOT_DATA_FILES;
}

async function renderPlannerPlots() {
    const requiredIds = ['plot-cost-cloud', 'plot-force-cloud', 'plot-controls', 'plot-velocities'];
    const arePlotsPresent = requiredIds.every(function(id) {
        return !!document.getElementById(id);
    });

    if (!arePlotsPresent) return;

    if (typeof Plotly === 'undefined') {
        setPlannerPlotsStatus('Plotly failed to load. Check network access and refresh.', true);
        return;
    }

    if (window.location.protocol === 'file:') {
        setPlannerPlotsStatus(
            'Open this page through a local server (not file://). Run: python3 -m http.server 8000 and open http://localhost:8000',
            true
        );
        return;
    }

    setPlannerPlotsStatus('Loading plot data...', false);

    try {
        const dataSources = await resolvePlotDataSources();
        const cloudData = await fetchJson(dataSources.cloud);
        const trajectoriesData = await fetchJson(dataSources.trajectories);

        const cloudPoints = Array.isArray(cloudData.points) ? cloudData.points : [];
        const trajectories = Array.isArray(trajectoriesData.trajectories) ? trajectoriesData.trajectories : [];

        if (cloudPoints.length === 0) {
            throw new Error('Cloud JSON has no points.');
        }
        if (trajectories.length === 0) {
            throw new Error('Trajectory JSON has no trajectories.');
        }

        const pathTrajectory = preferredPathTrajectory(trajectories);
        if (!pathTrajectory || !Array.isArray(pathTrajectory.points) || pathTrajectory.points.length === 0) {
            throw new Error('No valid path trajectory found (expected path_replay or path_estimated).');
        }

        const controlsTrajectory = trajectoryByName(trajectories, 'cables_sent');
        const velocitiesTrajectory = trajectoryByName(trajectories, 'cable_velocities');

        if (!controlsTrajectory || !Array.isArray(controlsTrajectory.points)) {
            throw new Error('No valid cables_sent trajectory found.');
        }
        if (!velocitiesTrajectory || !Array.isArray(velocitiesTrajectory.points)) {
            throw new Error('No valid cable_velocities trajectory found.');
        }

        const pathTraces = buildPathTraces(pathTrajectory.points);

        const costCloudTrace = buildCloudTrace(cloudPoints, 'color_cost', 'Cost', COST_COLOR_SCALE);
        const forceCloudTrace = buildCloudTrace(cloudPoints, 'color_force', 'Force', 'Plasma');

        await Plotly.newPlot(
            'plot-cost-cloud',
            [costCloudTrace].concat(pathTraces),
            buildCloudLayout('Cost Cloud + Replay Path'),
            PLOTLY_CONFIG
        );

        await Plotly.newPlot(
            'plot-force-cloud',
            [forceCloudTrace].concat(pathTraces),
            buildCloudLayout('Force Cloud + Replay Path'),
            PLOTLY_CONFIG
        );

        const controlTraces = buildLineTraces(controlsTrajectory.points, ['u1', 'u2', 'u3'], ['#1f77b4', '#ff7f0e', '#2ca02c']);
        await Plotly.newPlot(
            'plot-controls',
            controlTraces,
            buildLineLayout('Control Inputs', 'u'),
            PLOTLY_CONFIG
        );

        const velocityTraces = buildLineTraces(velocitiesTrajectory.points, ['v1', 'v2', 'v3'], ['#1f77b4', '#ff7f0e', '#2ca02c']);
        await Plotly.newPlot(
            'plot-velocities',
            velocityTraces,
            buildLineLayout('Control Velocities', 'du/dt'),
            PLOTLY_CONFIG
        );

        setPlannerPlotsStatus('Plots loaded: cost cloud, force cloud, controls and velocities.', false);
    } catch (error) {
        console.error(error);
        if (error && error.name === 'TypeError') {
            setPlannerPlotsStatus(
                'Could not load plots due to a network/fetch error. Make sure the page is served via http://localhost and not opened as a local file.',
                true
            );
            return;
        }
        setPlannerPlotsStatus('Could not load plots: ' + error.message, true);
    }
}

function initPage() {
    var options = {
		slidesToScroll: 1,
		slidesToShow: 1,
		loop: true,
		infinite: true,
		autoplay: true,
		autoplaySpeed: 5000,
    }

    // Initialize carousel only when library is available.
    if (typeof bulmaCarousel !== 'undefined' && typeof bulmaCarousel.attach === 'function') {
        bulmaCarousel.attach('.carousel', options);
    }

    if (typeof bulmaSlider !== 'undefined' && typeof bulmaSlider.attach === 'function') {
        bulmaSlider.attach();
    }
    
    // Setup video autoplay for carousel
    setupVideoCarouselAutoplay();

    // Load interactive planning plots from JSON files.
    renderPlannerPlots();
}

if (typeof window.jQuery !== 'undefined') {
    window.jQuery(function() {
        initPage();
    });
} else {
    document.addEventListener('DOMContentLoaded', function() {
        initPage();
    });
}
